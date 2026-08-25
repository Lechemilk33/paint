'use client';

import { Button } from '@/components/ui/button';
import { PieceInquiry } from '@/features/inquiries/components/piece-inquiry';
import { type Painting } from '@/lib/paintings/schema';
import { useCart } from './cart-provider';
import { HoldButton } from './hold-button';

/** What the visitor can do about this piece, which depends entirely on its
 *  availability. Wrapped in a row so the buttons size to their content: as a
 *  direct child of the detail column's flex stack they would be stretched. */
export function PaintingPurchase({ painting }: { painting: Painting }) {
  const { isHeld, setOpen } = useCart();

  if (painting.availability === 'available') {
    return (
      <div className="flex flex-col gap-4">
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
