import type { Painting } from '@/lib/paintings/schema';

const PRICE_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Prices are stored in minor units; whole dollars are what gets shown. */
export function formatPrice(priceCents: number): string {
  return PRICE_FORMAT.format(priceCents / 100);
}

export function formatDimensions(painting: Pick<Painting, 'widthIn' | 'heightIn'>): string {
  return `${painting.widthIn} x ${painting.heightIn} in`;
}
