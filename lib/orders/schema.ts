import { z } from 'zod';

/**
 * Where an order stands.
 *
 * `paid` is the normal terminal state for the money: Stripe has the funds and
 * the studio owes a painting. Fulfilment is tracked separately below, because
 * "paid" and "shipped" are weeks apart for work that has to be crated.
 *
 * `needs_refund` is the state nobody wants and every one-of-one shop needs. It
 * means the payment succeeded for a piece that was already sold - a race the
 * hold system is designed to prevent, but which is recorded honestly rather
 * than papered over if it ever happens. See lib/orders/holds.ts.
 */
export const orderStatusSchema = z.enum(['paid', 'needs_refund', 'refunded']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid',
  needs_refund: 'Needs refund',
  refunded: 'Refunded',
};

export const fulfillmentSchema = z.enum(['unshipped', 'shipped']);
export type Fulfillment = z.infer<typeof fulfillmentSchema>;

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  unshipped: 'Not shipped',
  shipped: 'Shipped',
};

/**
 * The postal address a piece is going to, as Stripe collected it. Stored flat
 * and all-optional because address shape varies by country and a missing
 * `state` is normal outside the US - the studio reads this to write a label,
 * so it is captured rather than validated.
 */
export const shippingAddressSchema = z.object({
  name: z.string().default(''),
  line1: z.string().default(''),
  line2: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default(''),
});
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

/**
 * A paid order.
 *
 * Like an inquiry, this snapshots the painting rather than referencing it: the
 * title and the price at the moment of sale are part of the receipt, and must
 * not change because the piece was later retitled or repriced. The id is kept
 * so the admin can still link through.
 */
export const orderSchema = z.object({
  id: z.string().min(1),
  /** Short, human-quotable handle, e.g. VR-9C41 - matches the inquiry style. */
  reference: z.string().min(1),
  status: orderStatusSchema,
  fulfillment: fulfillmentSchema,

  paintingId: z.string().min(1),
  paintingTitle: z.string().min(1),
  paintingSlug: z.string().default(''),

  /** What was actually charged, split so the studio can see the shipping. */
  subtotalCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  currency: z.string().default('usd'),

  buyerName: z.string().default(''),
  buyerEmail: z.string().default(''),
  shippingAddress: shippingAddressSchema,

  /** Stripe's ids, for reconciling against the dashboard. */
  stripeSessionId: z.string().min(1),
  stripePaymentIntentId: z.string().default(''),

  /** Studio-only, never shown to the buyer. */
  notes: z.string().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Order = z.infer<typeof orderSchema>;

/** Orders needing the studio's attention: unshipped, or a botched race. */
export function countOpen(orders: Order[]): number {
  return orders.filter(
    (order) => order.status === 'needs_refund' || (order.status === 'paid' && order.fulfillment === 'unshipped'),
  ).length;
}

export function formatOrderTotal(order: Order): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: order.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(order.totalCents / 100);
}
