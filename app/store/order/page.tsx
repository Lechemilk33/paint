import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeltRule } from '@/features/storefront/components/melt-rule';
import { SpikeRule } from '@/features/storefront/components/spike-rule';
import { formatPrice } from '@/features/storefront/format';
import { getStudio } from '@/lib/studio/repository';
import { studioName } from '@/lib/studio/schema';
import { stripe, stripeConfigured } from '@/lib/stripe/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order',
  // Nothing here should ever turn up in a search result.
  robots: { index: false, follow: false },
};

/**
 * Where Stripe returns someone after checkout.
 *
 * This page only reads. It marks nothing sold and records no order - the
 * webhook does both, because a browser that never comes back has still paid
 * and a browser that arrives here uninvited has not. So the worst this page can
 * do when it is wrong is show the wrong words to one person.
 *
 * The session is re-fetched from Stripe rather than trusted from the URL, which
 * is what makes "paid" here mean paid. A forged or unknown session id resolves
 * to nothing and gets the fallback.
 */
export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const studio = await getStudio();
  // May be blank, and blank means blank: the fallback copy drops the sentence
  // rather than inventing an address to send a worried buyer to.
  const email = studio.contactEmail;

  let paid = false;
  let buyerEmail = '';
  let title = '';
  let totalCents = 0;

  if (sessionId && stripeConfigured()) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
      paid = session.payment_status === 'paid';
      buyerEmail = session.customer_details?.email ?? '';
      title = session.line_items?.data[0]?.description ?? '';
      totalCents = session.amount_total ?? 0;
    } catch (cause) {
      // An unknown id is the ordinary case for a hand-typed URL, not an
      // incident; the page falls through to the "we cannot find it" copy.
      console.warn('Could not retrieve the checkout session', cause);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-12 pb-24 sm:px-8">
      <SpikeRule className="text-acid/50" mirrored />

      {paid ? (
        <>
          <p className="text-acid tracking-label mt-10 flex items-center gap-2 font-mono text-xs uppercase">
            <CircleCheck aria-hidden="true" className="size-4" />
            Payment received
          </p>
          <h1 className="font-poster mt-4 text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl">
            It&rsquo;s
            <span className="text-magenta"> yours</span>
          </h1>

          {title ? (
            <p className="text-foreground-secondary mt-5 text-base leading-relaxed sm:text-lg">
              <span className="text-foreground font-semibold">{title}</span>
              {totalCents > 0 ? ` — ${formatPrice(totalCents)}` : ''}
            </p>
          ) : null}

          <p className="text-foreground-secondary mt-5 max-w-xl text-base leading-relaxed">
            The payment went through{buyerEmail ? `, and the studio has ${buyerEmail}` : ''}. Each
            piece is packed crated and insured, and you will hear about timing before it ships.
          </p>

          <div className="mt-10">
            <MeltRule className="text-magenta/50" />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="tracking-label rounded-none font-mono text-xs uppercase">
              <Link href="/store">Back to the work</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
            >
              <Link href="/store/commission">Commission something</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted-foreground tracking-label mt-10 flex items-center gap-2 font-mono text-xs uppercase">
            <CircleAlert aria-hidden="true" className="size-4" />
            Nothing to show
          </p>
          <h1 className="font-poster mt-4 text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl">
            No order here
          </h1>
          <p className="text-foreground-secondary mt-5 max-w-xl text-base leading-relaxed">
            This page is where checkout lands once a payment goes through. If you have just paid
            and are seeing this, nothing has been lost
            {email ? (
              <>
                {' '}- write to{' '}
                <a className="text-voltage underline underline-offset-4" href={`mailto:${email}`}>
                  {email}
                </a>{' '}
                and {studioName(studio)} will sort it out.
              </>
            ) : (
              <> - the payment is recorded either way, and {studioName(studio)} will be in touch.</>
            )}
          </p>

          <div className="mt-10">
            <MeltRule className="text-magenta/50" />
          </div>

          <div className="mt-10">
            <Button asChild size="lg" className="tracking-label rounded-none font-mono text-xs uppercase">
              <Link href="/store">Back to the work</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
