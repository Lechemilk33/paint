/**
 * What a failed checkout tells the browser. There is no success case: success
 * is a redirect to Stripe, which never returns.
 *
 * This lives outside checkout-actions.ts because a `'use server'` module may
 * only export async functions. Exporting the initial state from there compiles,
 * but the route's server-action module then fails to evaluate - and because
 * that module carries every action the page uses, it takes the inquiry forms
 * down with it: any POST from a painting page answers 500. The same rule is why
 * features/admin/form-state.ts exists.
 */
export interface CheckoutState {
  error: string | null;
}

export const EMPTY_CHECKOUT_STATE: CheckoutState = { error: null };
