import 'server-only';
import { randomUUID, randomBytes } from 'node:crypto';
import { RECORDS, blobStore } from '@/lib/storage/blobs';
import {
  inquirySchema,
  type Inquiry,
  type InquiryInput,
  type InquiryStatus,
} from './schema';

/**
 * Inquiries share the catalog's storage but not its document: the inbox grows
 * without bound while the catalog does not, and keeping them apart means
 * rendering the storefront never reads a message.
 *
 * As with the catalog this is one JSON document, which is the right shape until
 * the inbox reaches thousands of records. See `INBOX_LIMIT` for what happens
 * then.
 */
const INBOX_KEY = 'inquiries';

/**
 * Hard ceiling on stored inquiries. A public form with no account behind it is
 * the one part of this app a stranger can write to, so it needs a bound: past
 * this, the oldest archived records are dropped to make room, and if there are
 * none the oldest overall goes. Losing the oldest archived message is a far
 * better failure than an unbounded document that eventually cannot be read.
 */
const INBOX_LIMIT = 2000;

interface InboxDocument {
  inquiries: Inquiry[];
}

async function readInbox(): Promise<Inquiry[]> {
  const doc = await blobStore(RECORDS).getJSON<InboxDocument>(INBOX_KEY);
  if (!doc?.inquiries) return [];
  const parsed = inquirySchema.array().safeParse(doc.inquiries);
  if (!parsed.success) {
    throw new Error(`Stored inquiries do not match the current schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function writeInbox(inquiries: Inquiry[]): Promise<void> {
  await blobStore(RECORDS).setJSON(INBOX_KEY, { inquiries } satisfies InboxDocument);
}

/** Newest first - the only order an inbox is ever wanted in. */
export async function listInquiries(): Promise<Inquiry[]> {
  const inquiries = await readInbox();
  return inquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  return (await readInbox()).find((inquiry) => inquiry.id === id) ?? null;
}

/**
 * A short handle a person can read down the phone or quote in a subject line.
 * Crockford-ish alphabet: no I, O, U or 1, so it cannot be misheard or mistyped
 * into a different reference.
 */
function makeReference(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTVWXYZ';
  const bytes = randomBytes(4);
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `VR-${body}`;
}

/** Trims the inbox to the ceiling, sacrificing archived records first. */
function withinLimit(inquiries: Inquiry[]): Inquiry[] {
  if (inquiries.length <= INBOX_LIMIT) return inquiries;

  const byOldest = [...inquiries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const doomed = new Set<string>();
  for (const inquiry of byOldest) {
    if (inquiries.length - doomed.size <= INBOX_LIMIT) break;
    if (inquiry.status === 'archived') doomed.add(inquiry.id);
  }
  for (const inquiry of byOldest) {
    if (inquiries.length - doomed.size <= INBOX_LIMIT) break;
    doomed.add(inquiry.id);
  }
  return inquiries.filter((inquiry) => !doomed.has(inquiry.id));
}

export async function createInquiry(input: InquiryInput): Promise<Inquiry> {
  const inquiries = await readInbox();
  const now = new Date().toISOString();
  const inquiry: Inquiry = {
    ...input,
    id: randomUUID(),
    reference: makeReference(),
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
  await writeInbox(withinLimit([...inquiries, inquiry]));
  return inquiry;
}

export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const inquiries = await readInbox();
  const index = inquiries.findIndex((inquiry) => inquiry.id === id);
  if (index === -1) return;

  inquiries[index] = { ...inquiries[index], status, updatedAt: new Date().toISOString() };
  await writeInbox(inquiries);
}

/**
 * Marks an inquiry seen the first time it is opened. Only `new` moves, so
 * re-reading something already replied to does not walk its status backwards.
 */
export async function markInquiryOpened(id: string): Promise<void> {
  const inquiries = await readInbox();
  const index = inquiries.findIndex((inquiry) => inquiry.id === id);
  if (index === -1 || inquiries[index].status !== 'new') return;

  inquiries[index] = { ...inquiries[index], status: 'open', updatedAt: new Date().toISOString() };
  await writeInbox(inquiries);
}

export async function setInquiryNotes(id: string, notes: string): Promise<void> {
  const inquiries = await readInbox();
  const index = inquiries.findIndex((inquiry) => inquiry.id === id);
  if (index === -1) return;

  inquiries[index] = {
    ...inquiries[index],
    notes: notes.trim(),
    updatedAt: new Date().toISOString(),
  };
  await writeInbox(inquiries);
}

export async function deleteInquiry(id: string): Promise<void> {
  const inquiries = await readInbox();
  await writeInbox(inquiries.filter((inquiry) => inquiry.id !== id));
}
