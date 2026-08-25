import 'server-only';
import { randomUUID, randomBytes } from 'node:crypto';
import { RECORDS, blobStore } from '@/lib/storage/blobs';
import {
  enquirySchema,
  type Enquiry,
  type EnquiryInput,
  type EnquiryStatus,
} from './schema';

/**
 * Enquiries share the catalog's storage but not its document: the inbox grows
 * without bound while the catalog does not, and keeping them apart means
 * rendering the storefront never reads a message.
 *
 * As with the catalog this is one JSON document, which is the right shape until
 * the inbox reaches thousands of records. See `INBOX_LIMIT` for what happens
 * then.
 */
const INBOX_KEY = 'enquiries';

/**
 * Hard ceiling on stored enquiries. A public form with no account behind it is
 * the one part of this app a stranger can write to, so it needs a bound: past
 * this, the oldest archived records are dropped to make room, and if there are
 * none the oldest overall goes. Losing the oldest archived message is a far
 * better failure than an unbounded document that eventually cannot be read.
 */
const INBOX_LIMIT = 2000;

interface InboxDocument {
  enquiries: Enquiry[];
}

async function readInbox(): Promise<Enquiry[]> {
  const doc = await blobStore(RECORDS).getJSON<InboxDocument>(INBOX_KEY);
  if (!doc?.enquiries) return [];
  const parsed = enquirySchema.array().safeParse(doc.enquiries);
  if (!parsed.success) {
    throw new Error(`Stored enquiries do not match the current schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function writeInbox(enquiries: Enquiry[]): Promise<void> {
  await blobStore(RECORDS).setJSON(INBOX_KEY, { enquiries } satisfies InboxDocument);
}

/** Newest first - the only order an inbox is ever wanted in. */
export async function listEnquiries(): Promise<Enquiry[]> {
  const enquiries = await readInbox();
  return enquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  return (await readInbox()).find((enquiry) => enquiry.id === id) ?? null;
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
function withinLimit(enquiries: Enquiry[]): Enquiry[] {
  if (enquiries.length <= INBOX_LIMIT) return enquiries;

  const byOldest = [...enquiries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const doomed = new Set<string>();
  for (const enquiry of byOldest) {
    if (enquiries.length - doomed.size <= INBOX_LIMIT) break;
    if (enquiry.status === 'archived') doomed.add(enquiry.id);
  }
  for (const enquiry of byOldest) {
    if (enquiries.length - doomed.size <= INBOX_LIMIT) break;
    doomed.add(enquiry.id);
  }
  return enquiries.filter((enquiry) => !doomed.has(enquiry.id));
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const enquiries = await readInbox();
  const now = new Date().toISOString();
  const enquiry: Enquiry = {
    ...input,
    id: randomUUID(),
    reference: makeReference(),
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
  await writeInbox(withinLimit([...enquiries, enquiry]));
  return enquiry;
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<void> {
  const enquiries = await readInbox();
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1) return;

  enquiries[index] = { ...enquiries[index], status, updatedAt: new Date().toISOString() };
  await writeInbox(enquiries);
}

/**
 * Marks an enquiry seen the first time it is opened. Only `new` moves, so
 * re-reading something already replied to does not walk its status backwards.
 */
export async function markEnquiryOpened(id: string): Promise<void> {
  const enquiries = await readInbox();
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1 || enquiries[index].status !== 'new') return;

  enquiries[index] = { ...enquiries[index], status: 'open', updatedAt: new Date().toISOString() };
  await writeInbox(enquiries);
}

export async function setEnquiryNotes(id: string, notes: string): Promise<void> {
  const enquiries = await readInbox();
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1) return;

  enquiries[index] = {
    ...enquiries[index],
    notes: notes.trim(),
    updatedAt: new Date().toISOString(),
  };
  await writeInbox(enquiries);
}

export async function deleteEnquiry(id: string): Promise<void> {
  const enquiries = await readInbox();
  await writeInbox(enquiries.filter((enquiry) => enquiry.id !== id));
}
