'use client';

import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Painting } from '../schema';
import { useCart } from './cart-provider';

/**
 * Puts a piece on hold, or takes it back off. Only ever shown for pieces that
 * are actually available - a sold canvas has no version of this control, which
 * is why the caller checks status rather than this rendering a disabled button.
 *
 * Deliberately silent: the button relabels itself and the header's hold count
 * ticks up, which says it twice already. A toast would also have to be styled
 * across the token boundary, since the toaster is portalled outside the
 * storefront subtree and would otherwise arrive in the CRM's theme.
 */
export function HoldButton({
  painting,
  size = 'default',
  className,
}: {
  painting: Painting;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const { isHeld, hold, release } = useCart();
  const held = isHeld(painting.id);

  function handleClick() {
    if (held) release(painting.id);
    else hold(painting.id);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={held ? 'outline' : 'default'}
      onClick={handleClick}
      aria-pressed={held}
      className={cn(
        'rounded-none font-mono text-xs tracking-label uppercase',
        held && 'border-voltage/60 text-voltage hover:bg-voltage/10 hover:text-voltage',
        className,
      )}
    >
      {held ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {held ? 'On hold' : 'Hold this piece'}
    </Button>
  );
}
