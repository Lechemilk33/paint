'use client';

import { Button } from '@/components/ui/button';
import { PieceEnquiry } from '@/features/enquiries/components/piece-enquiry';
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
        <PieceEnquiry painting={painting} />
      </div>
    );
  }

  const message = {
    sold: 'This one has found a wall. A commission in the same vein is open.',
    on_hold: 'Someone has a hold on this piece. Ask to be next in line if it comes back.',
    not_for_sale: 'This piece is not for sale. It is here so you can see the work.',
    available: '',
  }[painting.availability];

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-foreground-secondary text-sm">{message}</p>
      <PieceEnquiry painting={painting} />
    </div>
  );
}
