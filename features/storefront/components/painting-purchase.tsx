'use client';

import { Button } from '@/components/ui/button';
import { type Painting } from '@/lib/paintings/schema';
import { STUDIO } from '../studio';
import { useCart } from './cart-provider';
import { HoldButton } from './hold-button';

/** What the visitor can do about this piece, which depends entirely on its
 *  availability. Wrapped in a row so the buttons size to their content: as a
 *  direct child of the detail column's flex stack they would be stretched. */
export function PaintingPurchase({ painting }: { painting: Painting }) {
  const { isHeld, setOpen } = useCart();

  if (painting.availability === 'available') {
    return (
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
    );
  }

  const message = {
    sold: 'This one has found a wall. Commissions in the same vein are open.',
    on_hold: 'Someone has a hold on this piece. Ask to be next in line if it comes back.',
    not_for_sale: 'This piece is not for sale. It is here so you can see the work.',
    available: '',
  }[painting.availability];

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-foreground-secondary text-sm">{message}</p>
      <Button
        asChild
        size="lg"
        variant="outline"
        className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
      >
        <a href={`mailto:${STUDIO.contactEmail}?subject=${encodeURIComponent(painting.title)}`}>
          Ask about this piece
        </a>
      </Button>
    </div>
  );
}
