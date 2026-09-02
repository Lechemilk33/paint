'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Paintbrush, Printer, ShoppingBag, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/features/storefront/format';
import type { InquiryKind } from '@/lib/inquiries/schema';
import { printsPriced, type Painting } from '@/lib/paintings/schema';
import { InquiryForm } from './inquiry-form';

/** The four things a person can want from a canvas they are looking at. */
type AskKind = Extract<InquiryKind, 'purchase' | 'piece' | 'similar' | 'print'>;

interface Ask {
  icon: LucideIcon;
  /** On the button, which has to make sense before the panel is open. */
  button: string;
  heading: (title: string) => string;
  blurb: (painting: Painting) => string;
  submit: string;
}

const ASKS: Record<AskKind, Ask> = {
  purchase: {
    icon: ShoppingBag,
    button: 'Buy this piece',
    heading: (title) => `Buy ${title}`,
    blurb: () =>
      'Say who you are and the studio comes back with an invoice, the shipping cost and a date. The piece is not committed to anyone until you have agreed both.',
    submit: 'Buy this piece',
  },
  piece: {
    icon: MessageSquare,
    button: 'Ask a question',
    heading: (title) => `Ask about ${title}`,
    blurb: () => 'Condition, framing, shipping, how it reads in daylight - anything.',
    submit: 'Send question',
  },
  similar: {
    icon: Paintbrush,
    button: 'Request something similar',
    heading: (title) => `Something in the vein of ${title}`,
    blurb: () => 'A new painting worked in the same register as this one.',
    submit: 'Send request',
  },
  print: {
    icon: Printer,
    button: 'Request a print',
    heading: (title) => `A print of ${title}`,
    // The price is the studio's own, set per piece in the admin. Where none has
    // been set the sentence says so rather than implying a figure exists.
    blurb: (painting) =>
      printsPriced(painting)
        ? `A reproduction of this image, printed to order at ${formatPrice(painting.printPriceCents)} each.`
        : 'A reproduction of this image, printed to order. The studio prices it when it replies.',
    submit: 'Send print request',
  },
};

/**
 * What a visitor can do about the piece they are looking at, inline on its own
 * page.
 *
 * Deliberately not a dialog: everything asked here is about the canvas on
 * screen, and a modal covers it up. Expanding in place keeps the painting
 * visible while they write, and leaves the form linkable at #ask.
 *
 * The asks share one panel rather than stacking buttons that each open their
 * own form, because they are alternatives - nobody sends two of them - and
 * because a page offering four competing calls to action at once has
 * effectively offered none. Buying leads, and is only offered here for a piece
 * that cannot be paid for by card: where checkout is switched on, the Buy
 * button above goes straight to Stripe and asking to buy by message as well
 * would be a slower way to do the same thing. A print only appears for a piece
 * the studio has marked as reproducible; reproduction rights are not something
 * this site gets to assume on the artist's behalf.
 */
export function PieceInquiry({
  painting,
  ask,
  offerPurchase = false,
}: {
  painting: Painting;
  ask?: string;
  /** Whether buying by message is the way to buy this piece. */
  offerPurchase?: boolean;
}) {
  const kinds: AskKind[] = [
    ...(offerPurchase ? (['purchase'] as const) : []),
    'piece',
    'similar',
    ...(painting.printsAvailable ? (['print'] as const) : []),
  ];

  // A query string is a stranger's input like any other. Anything that is not
  // one of the asks this piece actually offers - a typo, a stale link to a
  // print on a piece that no longer offers one - opens nothing.
  const requested = kinds.find((kind) => kind === ask) ?? null;

  const [mode, setMode] = useState<AskKind | null>(requested);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Seeded from the URL, so the first render is not a change the reader made
  // and must not grab their focus. Every later one is.
  const settled = useRef(mode === null);

  // Opening or switching moves the reader into the panel rather than leaving
  // them at a button while the thing they asked for appears somewhere below.
  useEffect(() => {
    if (!settled.current) {
      settled.current = true;
      return;
    }
    if (mode) headingRef.current?.focus();
  }, [mode]);

  const snapshot = [
    {
      id: painting.id,
      title: painting.title,
      slug: painting.slug,
      priceCents: painting.priceCents,
      printPriceCents: printsPriced(painting) ? painting.printPriceCents : 0,
    },
  ];

  const panel = mode ? ASKS[mode] : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {kinds.map((kind) => {
          const option = ASKS[kind];
          const Icon = option.icon;
          const isActive = mode === kind;
          // Buying is the one thing on this page worth shouting about, so it
          // takes the filled button and everything else stays an outline.
          const isPrimary = kind === 'purchase';
          return (
            <Button
              key={kind}
              asChild
              variant={isPrimary ? 'default' : 'outline'}
              size={isPrimary ? 'lg' : 'default'}
              className={cn(
                'tracking-label justify-start rounded-none font-mono text-xs uppercase sm:justify-center',
                isPrimary
                  ? 'w-full sm:w-auto'
                  : isActive
                    ? 'border-magenta text-magenta bg-magenta/10 hover:bg-magenta/15 hover:text-magenta'
                    : 'border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage',
                isPrimary && isActive && 'bg-magenta hover:bg-magenta/90',
              )}
            >
              {/* A real link, then intercepted. With JavaScript this is a local
                  toggle and nothing is fetched; without it, the href is a page
                  the server can render, which is the only reason the ask block
                  works at all with scripting off. */}
              <a
                href={
                  isActive
                    ? `/store/${painting.slug}`
                    : `/store/${painting.slug}?ask=${kind}#ask`
                }
                onClick={(event) => {
                  // Leave modified clicks alone: a new tab should get the page
                  // the href promises.
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  setMode(isActive ? null : kind);
                }}
                aria-expanded={isActive}
                aria-controls="ask"
              >
                <Icon aria-hidden="true" />
                {isPrimary && !isActive
                  ? `${option.button} - ${formatPrice(painting.priceCents)}`
                  : option.button}
              </a>
            </Button>
          );
        })}
      </div>

      {mode && panel ? (
        <section id="ask" className="border-border scroll-mt-24 border-t pt-6">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-poster mb-1 text-xl font-extrabold tracking-tight focus:outline-none"
          >
            {panel.heading(painting.title)}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">{panel.blurb(painting)}</p>
          {/* Keyed by mode so switching asks starts a clean form: the action
              state, the field errors and any success panel belong to the
              request that was being written, not to the next one. */}
          <InquiryForm
            key={mode}
            kind={mode}
            paintings={snapshot}
            submitLabel={panel.submit}
          />
        </section>
      ) : null}
    </div>
  );
}
