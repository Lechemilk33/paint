'use client';

import { Button } from '@/components/ui/button';
import { PieceInquiry } from '@/features/inquiries/components/piece-inquiry';
import { type Availability, type Painting } from '@/lib/paintings/schema';
import { BuyButton } from './buy-button';
import { useCart } from './cart-provider';
import { HoldButton } from './hold-button';

/**
 * A note only where the status badge above leaves a real question unanswered.
 * "Sold" and "Not for sale" are already stated twice on this page - in the
 * badge and in place of the price - and saying them a third time is noise. A
 * hold is the one state where what happens next is not obvious from the word.
 */
const NOTE: Partial<Record<Availability, string>> = {
  on_hold: 'Held for someone else while they decide. Holds do fall through.',
};

/**
 * What the visitor can do about this piece.
 *
 * Buying is offered only for a piece that is actually available; asking is
 * offered for every piece, because a sold canvas is still the best possible
 * description of what someone wants painted next. Wrapped in a row so the
 * buttons size to their content - as direct children of the detail column's
 * flex stack they would be stretched.
 *
 * `canBuy` is settled on the server, since it needs both the studio's per-piece
 * switch and a configured Stripe account, so this only decides layout. The ask
 * panel stays put either way: someone about to spend four figures on a canvas
 * often wants to ask something first, and taking that away to make room for a
 * Buy button would cost more sales than it closes.
 */
export function PaintingPurchase({
  painting,
  ask,
  canBuy,
}: {
  painting: Painting;
  ask?: string;
  canBuy: boolean;
}) {
  const { isHeld, setOpen } = useCart();
  const note = NOTE[painting.availability];

  return (
    <div className="flex flex-col items-start gap-4">
      {note ? <p className="text-foreground-secondary text-sm">{note}</p> : null}

      {painting.availability === 'available' ? (
        <>
          {canBuy ? <BuyButton painting={painting} /> : null}
          <div className="flex w-full flex-wrap items-center gap-3">
            <HoldButton painting={painting} size="lg" className="w-full sm:w-auto" />
            {isHeld(painting.id) ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setOpen(true)}
                className="hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
              >
                View holds
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      <PieceInquiry painting={painting} ask={ask} />
    </div>
  );
}
