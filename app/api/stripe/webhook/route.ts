import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { markPaintingSold } from '@/lib/paintings/repository';
import { recordOrder } from '@/lib/orders/repository';
import { releaseHoldBySession } from '@/lib/orders/holds';
import { stripe, stripeConfigured } from '@/lib/stripe/client';

/**
 * Stripe's report of what actually happened.
 *
 * This, not the browser's return trip, is what marks a painting sold. Someone
 * who pays and then closes the tab before the redirect has still paid, and
 * someone who forges their way onto the success page has not - so the success
 * page only ever reads state, and every write to the catalog and the order
 * ledger happens here, behind a signature check.
 *
 * Failures return 500 on purpose. Stripe retries a non-2xx for days, and both
 * the ledger write and the sale are idempotent, so a retry costs nothing and a
 * transient blob-store error is not allowed to lose a sale silently.
 */

function addressFrom(session: Stripe.Checkout.Session) {
  const shipping = session.collected_information?.shipping_details ?? null;
  const address = shipping?.address;
  return {
    name: shipping?.name ?? '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postalCode: address?.postal_code ?? '',
    country: address?.country ?? '',
  };
}

/**
 * Turns a paid session into a sale.
 *
 * Idempotent from both ends: `recordOrder` keys on the Stripe session id, and
 * `markPaintingSold` reports whether this call was the one that sold the piece.
 * A redelivered event therefore lands on the existing order and changes
 * nothing.
 */
async function fulfill(session: Stripe.Checkout.Session): Promise<void> {
  const paintingId = session.metadata?.paintingId;
  if (!paintingId) {
    // Not one of ours - a session created by hand in the dashboard, say.
    console.warn('Stripe session with no paintingId', session.id);
    return;
  }

  const sale = await markPaintingSold(paintingId);

  // A second payment for a piece already sold. The hold system exists to make
  // this impossible, but if it happens the money is real and the canvas is
  // not, so the order is written down as needing a refund rather than dropped.
  if (!sale.ok && sale.reason === 'already_sold') {
    console.error('Paid session for an already-sold painting', session.id, paintingId);
  }

  const painting = sale.painting;
  const shippingCents = session.total_details?.amount_shipping ?? 0;
  const totalCents = session.amount_total ?? 0;

  await recordOrder({
    status: sale.ok ? 'paid' : 'needs_refund',
    fulfillment: 'unshipped',
    paintingId,
    // The title is carried in the session metadata too, so an order stays
    // legible if the piece was deleted between checkout and payment.
    paintingTitle: painting?.title ?? session.metadata?.paintingTitle ?? 'Unknown piece',
    paintingSlug: painting?.slug ?? '',
    subtotalCents: Math.max(totalCents - shippingCents, 0),
    shippingCents,
    totalCents,
    currency: session.currency ?? 'usd',
    buyerName:
      session.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? '',
    buyerEmail: session.customer_details?.email ?? '',
    shippingAddress: addressFrom(session),
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? ''),
  });

  // The piece is sold, so the store and the admin both need re-rendering.
  revalidatePath('/store');
  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  if (painting?.slug) revalidatePath(`/store/${painting.slug}`);
}

export async function POST(request: Request): Promise<Response> {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe is not configured', { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  // Text, not json: the signature covers the exact bytes Stripe sent, and
  // parsing and re-serialising would change them.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (cause) {
    // A bad signature is not an error on this end - it is an unauthenticated
    // caller, and 400 tells Stripe not to bother retrying.
    console.warn('Rejected a Stripe webhook with a bad signature', cause);
    return new Response('Bad signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Bank debits and other delayed methods complete the session while
        // still unpaid; those are fulfilled by async_payment_succeeded below,
        // once the money has actually cleared.
        if (session.payment_status === 'paid') await fulfill(session);
        break;
      }

      case 'checkout.session.async_payment_succeeded':
        await fulfill(event.data.object);
        break;

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        // Nobody paid, so the canvas goes back on sale immediately rather than
        // waiting out the rest of the hold.
        const session = event.data.object;
        const paintingId = session.metadata?.paintingId;
        if (paintingId) await releaseHoldBySession(paintingId, session.id);
        break;
      }

      default:
        // Everything else is subscribed to by someone else, or by nobody.
        break;
    }
  } catch (cause) {
    console.error(`Failed handling Stripe event ${event.type}`, cause);
    return new Response('Handler failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
