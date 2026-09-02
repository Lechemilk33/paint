'use server';

import { redirect } from 'next/navigation';
import { getPaintingById } from '@/lib/paintings/repository';
import { canBuyNow, primaryPhoto } from '@/lib/paintings/schema';
import { CHECKOUT_WINDOW_MS, attachSession, releaseHold, takeHold } from '@/lib/orders/holds';
import { siteOrigin, stripe, stripeConfigured } from '@/lib/stripe/client';
import type { CheckoutState } from './checkout-state';

/**
 * Sends someone to Stripe to pay for one painting.
 *
 * The browser supplies an id and nothing else. Title, price and shipping are
 * all read from the catalog on this side - the same rule the inquiry form
 * follows, and for the same reason: what a visitor sends can decide *which*
 * piece they are buying, never what it costs.
 *
 * The order of operations is deliberate. The hold is taken first, because a
 * hold that loses its race must not leave a live Stripe session behind; the
 * session is created second; the session id is written back to the hold third,
 * so a later `checkout.session.expired` can find the hold it belongs to. If
 * Stripe fails anywhere in the middle the hold is released rather than left to
 * time out, so a transient error does not take a painting off sale for half an
 * hour.
 */
export async function startCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (!stripeConfigured()) {
    return { error: 'Checkout is not set up yet. Please send an inquiry instead.' };
  }

  const paintingId = String(formData.get('paintingId') ?? '');
  if (!paintingId) return { error: 'That request was missing a painting.' };

  const painting = await getPaintingById(paintingId);
  if (!painting) return { error: 'That piece is no longer in the catalog.' };
  if (!canBuyNow(painting)) {
    return { error: 'That piece is not available to buy directly. Please send an inquiry.' };
  }

  const claim = await takeHold(painting.id);
  if (!claim.ok) {
    return {
      error:
        'Someone is at the till with this one right now. It is a single canvas, so if their checkout lapses it comes straight back - or send an inquiry and the studio will tell you either way.',
    };
  }

  const photo = primaryPhoto(painting);
  const origin = await siteOrigin();
  let url: string | null = null;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      // The session expires before the hold does, so Stripe stops accepting
      // payment while the piece is still claimed - never the other way round.
      // See CHECKOUT_WINDOW_MS for why this is not simply thirty minutes.
      expires_at: Math.floor((Date.now() + CHECKOUT_WINDOW_MS) / 1000),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: painting.priceCents,
            product_data: {
              name: painting.title,
              description: `${painting.medium}, ${painting.heightIn} x ${painting.widthIn} in, ${painting.year}`,
              // Stripe fetches this itself, so it has to be absolute and
              // publicly reachable - a relative /api/photos path would render
              // as a broken image on the checkout page.
              ...(photo ? { images: [`${origin}/api/photos/${photo.id}`] } : {}),
            },
          },
        },
      ],
      // A painting has to go somewhere, so an address is not optional. The
      // list is deliberately short: every country here is one the studio has
      // said it will crate and ship to.
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'] },
      ...(painting.shippingCents > 0
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: 'fixed_amount' as const,
                  display_name: 'Crated and insured',
                  fixed_amount: { amount: painting.shippingCents, currency: 'usd' },
                },
              },
            ],
          }
        : {}),
      // Read back by the webhook. This is the only link from a Stripe session
      // to the catalog, so both ids are carried rather than looked up by name.
      metadata: {
        paintingId: painting.id,
        holdId: claim.hold.holdId,
        // Carried so an order can still name its piece if the painting is
        // deleted between checkout and payment.
        paintingTitle: painting.title,
      },
      success_url: `${origin}/store/order?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/${painting.slug}?checkout=cancelled`,
    });

    await attachSession(claim.hold, session.id);
    url = session.url;
  } catch (cause) {
    console.error('Could not create a Stripe checkout session', cause);
    await releaseHold(painting.id, claim.hold.holdId);
    return { error: 'Something went wrong reaching the payment provider. Please try again.' };
  }

  if (!url) {
    await releaseHold(painting.id, claim.hold.holdId);
    return { error: 'The payment provider did not return a checkout page. Please try again.' };
  }

  // Outside the try: redirect() signals by throwing, and catching it here
  // would release the hold and swallow the navigation.
  redirect(url);
}
