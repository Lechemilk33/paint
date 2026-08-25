import 'server-only';
import { randomUUID } from 'node:crypto';
import { HOLDS, blobStore } from '@/lib/storage/blobs';

/**
 * Checkout reservations.
 *
 * Every piece in this catalog is one of one, which makes the obvious bug the
 * expensive one: two people with the same painting in their basket, both
 * clicking Buy, both paying. The studio then owes a refund and an apology for
 * a canvas that does not exist twice.
 *
 * A hold is how that is prevented. Before a Checkout Session is created the
 * painting's key is claimed with an atomic create - the storage layer's
 * `setJSONIfNew`, which resolves server-side, so of two simultaneous claims
 * exactly one is told it won. The loser never reaches Stripe at all and is sent
 * to the inquiry form instead.
 *
 * The hold is a lock with a deadline, not a promise. It expires on its own so
 * an abandoned checkout cannot take a painting off sale forever, and it is
 * matched to the Checkout Session's own expiry so the two cannot disagree.
 *
 * A hold is deliberately *not* the record of a sale. It lives in its own store,
 * it is disposable, and losing the whole store would cost nothing but a window
 * of unprotected concurrency. What actually marks a painting sold is the
 * webhook, against the catalog, after Stripe confirms the money.
 */

/**
 * How long someone gets to finish paying.
 *
 * Stripe's floor for a Checkout Session's expiry is thirty minutes *after the
 * session is created*, so asking for exactly thirty is asking to be rejected:
 * the request still has to cross the network, and the timestamp is truncated to
 * whole seconds on the way out. Both push the value under the floor. Thirty-one
 * clears it with room to spare and is still long enough to type an address
 * without parking someone else's purchase for the afternoon.
 */
export const CHECKOUT_WINDOW_MS = 31 * 60 * 1000;

/**
 * How long the piece stays claimed. Deliberately longer than the checkout
 * window, and the direction matters: if a session could outlive its hold, the
 * hold would lapse, someone else could buy the canvas, and the first person
 * could then still pay for it - which is the exact double-sale this file
 * exists to prevent. Erring the other way just keeps a piece claimed a few
 * minutes past a checkout nobody completed.
 */
export const HOLD_MS = CHECKOUT_WINDOW_MS + 4 * 60 * 1000;

export interface Hold {
  holdId: string;
  paintingId: string;
  /** Filled in once Stripe has issued the session. Empty in the gap between. */
  sessionId: string;
  expiresAt: string;
  createdAt: string;
}

function key(paintingId: string): string {
  return `hold/${paintingId}`;
}

function expired(hold: Hold, now: number): boolean {
  const at = Date.parse(hold.expiresAt);
  // An unparseable timestamp is treated as expired rather than as eternal: a
  // corrupt record should release a painting, never strand it.
  return !Number.isFinite(at) || at <= now;
}

async function read(paintingId: string): Promise<Hold | null> {
  return blobStore(HOLDS).getJSON<Hold>(key(paintingId));
}

/** The hold currently in force, or null if there is none or it has lapsed. */
export async function liveHold(paintingId: string): Promise<Hold | null> {
  const hold = await read(paintingId);
  if (!hold) return null;
  return expired(hold, Date.now()) ? null : hold;
}

export type HoldResult =
  | { ok: true; hold: Hold }
  | { ok: false; reason: 'held' };

/**
 * Claims a piece for a checkout, or reports that someone else already has it.
 *
 * The retry is for the lapsed-hold case only: if the key is taken by a hold
 * that has already expired, it is cleared and the claim is attempted once
 * more. Two callers can race into that clear, and the second `setJSONIfNew`
 * then decides between them exactly as the first would have - so the window
 * costs at most one caller a spurious "someone is checking out", never a
 * double hold.
 */
export async function takeHold(paintingId: string): Promise<HoldResult> {
  const now = Date.now();
  const hold: Hold = {
    holdId: randomUUID(),
    paintingId,
    sessionId: '',
    expiresAt: new Date(now + HOLD_MS).toISOString(),
    createdAt: new Date(now).toISOString(),
  };

  if (await blobStore(HOLDS).setJSONIfNew(key(paintingId), hold)) {
    return { ok: true, hold };
  }

  const existing = await read(paintingId);
  if (existing && !expired(existing, now)) return { ok: false, reason: 'held' };

  await blobStore(HOLDS).delete(key(paintingId));
  if (await blobStore(HOLDS).setJSONIfNew(key(paintingId), hold)) {
    return { ok: true, hold };
  }
  return { ok: false, reason: 'held' };
}

/** Records which Stripe session owns a hold, once Stripe has issued one. */
export async function attachSession(hold: Hold, sessionId: string): Promise<void> {
  await blobStore(HOLDS).setJSON(key(hold.paintingId), { ...hold, sessionId });
}

/**
 * Drops a hold, but only if it is still the one named.
 *
 * The guard matters: releasing by painting id alone would let a late
 * `checkout.session.expired` for an abandoned attempt tear down the hold of
 * the person who is at that moment typing their card in.
 */
export async function releaseHold(paintingId: string, holdId: string): Promise<void> {
  const existing = await read(paintingId);
  if (!existing || existing.holdId !== holdId) return;
  await blobStore(HOLDS).delete(key(paintingId));
}

/** Drops a hold by the Stripe session that owns it. Used by the webhook. */
export async function releaseHoldBySession(paintingId: string, sessionId: string): Promise<void> {
  const existing = await read(paintingId);
  if (!existing || existing.sessionId !== sessionId) return;
  await blobStore(HOLDS).delete(key(paintingId));
}
