'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/features/storefront/format';
import type { Painting } from '@/lib/paintings/schema';
import {
  EMPTY_CHECKOUT_STATE,
  startCheckoutAction,
} from '@/features/storefront/checkout-actions';

/**
 * Split out so it can call useFormStatus, which only reports the status of a
 * form above it in the tree - a hook in the same component as the <form> would
 * always read idle.
 */
function Submit({ painting }: { painting: Painting }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="tracking-label w-full rounded-none font-mono text-xs uppercase sm:w-auto"
    >
      {pending ? (
        <Loader2 aria-hidden="true" className="animate-spin" />
      ) : (
        <ShoppingBag aria-hidden="true" />
      )}
      {pending ? 'Taking you to checkout' : `Buy - ${formatPrice(painting.priceCents)}`}
    </Button>
  );
}

/**
 * Buy this canvas outright.
 *
 * Only rendered for pieces the studio has switched on for instant checkout, so
 * there is no disabled state: a piece that cannot be bought this way shows the
 * inquiry form instead and never renders this at all.
 *
 * A form posting to a server action rather than a fetch, because the action
 * ends in a redirect to Stripe. That also means it works with JavaScript still
 * loading, and that the shipping figure quoted below is the studio's own -
 * nothing about the price is decided in this component.
 */
export function BuyButton({ painting }: { painting: Painting }) {
  const [state, formAction] = useActionState(startCheckoutAction, EMPTY_CHECKOUT_STATE);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="paintingId" value={painting.id} />
      <Submit painting={painting} />

      <p className="text-muted-foreground font-mono text-xs">
        {painting.shippingCents > 0
          ? `Plus ${formatPrice(painting.shippingCents)} crated and insured shipping.`
          : 'Shipping included, crated and insured.'}{' '}
        Secure checkout by Stripe.
      </p>

      {state.error ? (
        <p role="alert" className="text-destructive max-w-prose text-sm">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
