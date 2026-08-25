import 'server-only';
import { randomUUID, randomBytes } from 'node:crypto';
import { ORDERS, blobStore } from '@/lib/storage/blobs';
import { orderSchema, type Fulfillment, type Order, type OrderStatus } from './schema';

/**
 * Orders live in their own store rather than alongside the catalog and the
 * inbox. They are the one record here that represents money, so they are kept
 * where nothing else writes: a bad catalog write should never be able to lose
 * a receipt.
 *
 * One JSON document, for the same reason the catalog is - a studio selling
 * originals counts orders in the hundreds, and a list is one read. There is no
 * ceiling on this document the way there is on the inbox, because a stranger
 * cannot write to it: an order only ever appears after Stripe reports a
 * completed payment.
 */
const LEDGER_KEY = 'orders';

interface LedgerDocument {
  orders: Order[];
}

async function readLedger(): Promise<Order[]> {
  const doc = await blobStore(ORDERS).getJSON<LedgerDocument>(LEDGER_KEY);
  if (!doc?.orders) return [];
  const parsed = orderSchema.array().safeParse(doc.orders);
  if (!parsed.success) {
    throw new Error(`Stored orders do not match the current schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function writeLedger(orders: Order[]): Promise<void> {
  await blobStore(ORDERS).setJSON(LEDGER_KEY, { orders } satisfies LedgerDocument);
}

/** Newest first. */
export async function listOrders(): Promise<Order[]> {
  const orders = await readLedger();
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | null> {
  return (await readLedger()).find((order) => order.id === id) ?? null;
}

/** Same alphabet as an inquiry reference: no I, O, U or 1 to mishear. */
function makeReference(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTVWXYZ';
  const bytes = randomBytes(4);
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `VR-${body}`;
}

export type NewOrder = Omit<Order, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'notes'>;

/**
 * Records a paid order, keyed on the Stripe session so it can only happen once.
 *
 * Stripe retries a webhook until it gets a 2xx, and will happily deliver the
 * same event twice on its own, so this is idempotent by construction: a second
 * call for a session already in the ledger returns the existing order rather
 * than writing a duplicate. That is what makes the webhook handler safe to
 * fail loudly - a retry costs nothing.
 */
export async function recordOrder(input: NewOrder): Promise<Order> {
  const orders = await readLedger();
  const existing = orders.find((order) => order.stripeSessionId === input.stripeSessionId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const order: Order = {
    ...input,
    id: randomUUID(),
    reference: makeReference(),
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
  await writeLedger([...orders, order]);
  return order;
}

async function mutate(id: string, change: (order: Order) => Order): Promise<Order | null> {
  const orders = await readLedger();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;
  const updated = { ...change(orders[index]), updatedAt: new Date().toISOString() };
  orders[index] = updated;
  await writeLedger(orders);
  return updated;
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  return mutate(id, (order) => ({ ...order, status }));
}

export async function setOrderFulfillment(id: string, fulfillment: Fulfillment): Promise<Order | null> {
  return mutate(id, (order) => ({ ...order, fulfillment }));
}

export async function setOrderNotes(id: string, notes: string): Promise<Order | null> {
  return mutate(id, (order) => ({ ...order, notes }));
}
