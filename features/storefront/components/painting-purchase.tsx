'use client';

import { Button } from '@/components/ui/button';
import { PieceInquiry } from '@/features/inquiries/components/piece-inquiry';
import { type Painting } from '@/lib/paintings/schema';
import { BuyButton } from './buy-button';
import { useCart } from './cart-provider';
import { HoldButton } from './hold-button';

/** What the visitor can do about this piece, which depends entirely on its
 *  availability. Wrapped in a row so the buttons size to their content: as a
 *  direct child of the detail column's flex stack they would be stretched.
 *
 *  `canBuy` is settled on the server - it needs both the studio's per-piece
 *  switch and a configured Stripe account - so this only decides layout. Every
 *  piece keeps the inquiry form underneath either way: someone about to spend
 *  four figures on a canvas often wants to ask something first, and taking that
 *  away to make room for a Buy button would cost more sales than it closes. */
export function PaintingPurchase({ painting, canBuy }: { painting: Painting; canBuy: boolean }) {
  const { isHeld, setOpen } = useCart();

  if (painting.availability === 'available') {
    return (
      <div className="flex flex-col gap-4">
        {canBuy ? <BuyButton painting={painting} /> : null}
        <div className="flex flex-wrap items-center gap-3">
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
        <PieceInquiry painting={painting} />
      </div>
    );
  }

  const message = {
    sold: 'Sold. Ask about a commission if you want something in this vein.',
    on_hold: 'On hold for someone. Ask to be next if it becomes available.',
    not_for_sale: 'Not for sale.',
    available: '',
  }[painting.availability];

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-foreground-secondary text-sm">{message}</p>
      <PieceInquiry painting={painting} />
    </div>
  );
}
