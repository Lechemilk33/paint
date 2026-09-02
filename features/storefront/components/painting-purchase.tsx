import { PieceInquiry } from '@/features/inquiries/components/piece-inquiry';
import { type Availability, type Painting } from '@/lib/paintings/schema';
import { BuyButton } from './buy-button';

/**
 * A note only where the status badge above leaves a real question unanswered.
 * "Sold" and "Not for sale" are already stated twice on this page - in the
 * badge and in place of the price - and saying them a third time is noise. A
 * piece the studio has reserved is the one state where what happens next is not
 * obvious from the word.
 */
const NOTE: Partial<Record<Availability, string>> = {
  on_hold: 'Reserved for someone else while they decide. Reservations do fall through.',
};

/**
 * What the visitor can do about this piece.
 *
 * Buying leads and everything else follows it. There are two ways to buy and
 * the piece decides which: where the studio has switched on card checkout, the
 * Buy button goes straight to Stripe; where it has not, buying is a message
 * that the studio answers with an invoice. Either way the first thing on the
 * page is a way to own the painting, which is the only reason most people are
 * reading it.
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
  const note = NOTE[painting.availability];
  const available = painting.availability === 'available';

  return (
    <div className="flex flex-col items-start gap-4">
      {note ? <p className="text-foreground-secondary text-sm">{note}</p> : null}

      {available && canBuy ? <BuyButton painting={painting} /> : null}

      <PieceInquiry
        painting={painting}
        ask={ask}
        // Only where a card cannot be taken. Offering both would be two buttons
        // that say Buy and do different things.
        offerPurchase={available && !canBuy}
      />
    </div>
  );
}
