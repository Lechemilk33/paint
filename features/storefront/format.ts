import type { Painting } from './schema';

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

/**
 * Originals sell one at a time, so the "cart" is a short list of held pieces and
 * the handoff is an email naming them. Built as a mailto rather than a checkout
 * because nothing here takes payment yet - swap this for a real checkout call
 * and the rest of the cart is unchanged.
 */
export function buildInquiryMailto(
  contactEmail: string,
  studioName: string,
  paintings: Painting[],
): string {
  const subject = `Purchase enquiry - ${paintings.length} ${paintings.length === 1 ? 'piece' : 'pieces'}`;
  const lines = [
    `Hello ${studioName},`,
    '',
    'I would like to buy the following:',
    ...paintings.map(
      (painting) =>
        `- ${painting.title} (${painting.year}), ${formatDimensions(painting)}, ${formatPrice(painting.priceCents)}`,
    ),
    '',
    `Total: ${formatPrice(paintings.reduce((sum, painting) => sum + painting.priceCents, 0))}`,
    '',
    'Please let me know about payment and shipping.',
    '',
  ];
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
