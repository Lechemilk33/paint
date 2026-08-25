import { z } from 'zod';

/**
 * How a piece exists in the world. Originals are one-of-one, so most of the
 * store treats a painting as a single indivisible thing - but prints are a real
 * category the studio sells, and they behave differently at checkout time, so
 * the distinction is recorded rather than inferred from the price.
 */
export const editionSchema = z.enum(['original', 'limited_print', 'open_print']);
export type Edition = z.infer<typeof editionSchema>;

export const EDITION_LABEL: Record<Edition, string> = {
  original: 'Original, one of one',
  limited_print: 'Limited edition print',
  open_print: 'Open edition print',
};

/**
 * Where a piece is in its life. Four states, not a stock count: an original
 * cannot have a quantity. `not_for_sale` covers work that is shown but held
 * back - already in a collection, promised to a show, or simply not for sale.
 */
export const availabilitySchema = z.enum(['available', 'on_hold', 'sold', 'not_for_sale']);
export type Availability = z.infer<typeof availabilitySchema>;

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: 'Available',
  on_hold: 'On hold',
  sold: 'Sold',
  not_for_sale: 'Not for sale',
};

/** Only `available` can be added to the enquiry basket. */
export function isPurchasable(availability: Availability): boolean {
  return availability === 'available';
}

/**
 * A photograph of a painting. The bytes live in blob storage under `key`; this
 * record is the metadata the app needs to lay the image out without fetching
 * it first. `position` orders the gallery, and position 0 is the piece's
 * primary image - the one the card and the social preview use.
 */
export const photoSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  contentType: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
  alt: z.string().default(''),
  position: z.number().int().nonnegative(),
});
export type Photo = z.infer<typeof photoSchema>;

/**
 * The fields a person actually fills in, mirroring the studio's submission
 * form one-for-one. Kept separate from the stored record so the form has a
 * single source of truth for validation and the server never trusts an id,
 * slug, or timestamp that arrived from a browser.
 *
 * Sizes are inches, entered height first to match how the form asks for them.
 * Price is entered in dollars and stored in cents, so no float ever reaches
 * the database.
 */
export const paintingInputSchema = z.object({
  title: z.string().trim().min(1, 'Give the painting a title'),
  year: z
    .number({ message: 'Enter the year it was finished' })
    .int('Year must be a whole number')
    .min(1900, 'That year seems too early')
    .max(new Date().getFullYear() + 1, 'That year is in the future'),
  medium: z.string().trim().min(1, 'Describe the medium'),
  heightIn: z.number({ message: 'Enter a height' }).positive('Height must be above zero'),
  widthIn: z.number({ message: 'Enter a width' }).positive('Width must be above zero'),
  priceCents: z
    .number({ message: 'Enter a price' })
    .int()
    .nonnegative('Price cannot be negative')
    .max(100_000_000, 'That price looks like a typo'),
  /** Curatorial grouping. Blank means the piece stands on its own. */
  series: z.string().trim().default(''),
  blurb: z.string().trim().min(1, 'Write the one-line description'),
  framingShipping: z.string().trim().min(1, 'Say how it is framed and shipped'),
  story: z.string().trim().min(1, 'Write the longer description'),
  edition: editionSchema,
  availability: availabilitySchema,
  /** Studio-only. Never rendered on the public site. */
  driveFolder: z.string().trim().default(''),
  notes: z.string().trim().default(''),
});
export type PaintingInput = z.infer<typeof paintingInputSchema>;

/** A painting as stored: the submitted fields plus what the server owns. */
export const paintingSchema = paintingInputSchema.extend({
  id: z.string().min(1),
  /** URL segment, derived from the title and kept unique across the catalog. */
  slug: z.string().min(1),
  photos: z.array(photoSchema).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Painting = z.infer<typeof paintingSchema>;

/** The primary image, or null for a piece with no photos uploaded yet. */
export function primaryPhoto(painting: Painting): Photo | null {
  return [...painting.photos].sort((a, b) => a.position - b.position)[0] ?? null;
}

/** Gallery order. Sorting here means callers never depend on stored order. */
export function orderedPhotos(painting: Painting): Photo[] {
  return [...painting.photos].sort((a, b) => a.position - b.position);
}

/** Public URL for a stored photo. Served by the app, not the blob store. */
export function photoUrl(photo: Photo): string {
  return `/api/photos/${photo.id}`;
}

/**
 * A URL-safe segment derived from a title. Punctuation and accents are folded
 * away so two visually similar titles cannot produce byte-different slugs.
 */
export function slugify(title: string): string {
  return (
    title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled'
  );
}

/**
 * Slugs the store already uses for its own pages. A painting that took one of
 * these would be unreachable - Next resolves the static segment first - so the
 * catalog refuses them and appends a suffix instead.
 */
export const RESERVED_SLUGS = new Set(['commission', 'about', 'contact', 'studio', 'cart']);

/** Filter state for the catalog grid. `null` means "no filter applied". */
export interface PaintingFilters {
  series: string | null;
  availability: Availability | null;
}

export const NO_PAINTING_FILTERS: PaintingFilters = { series: null, availability: null };

export function filterPaintings(paintings: Painting[], filters: PaintingFilters): Painting[] {
  return paintings.filter(
    (painting) =>
      (filters.series === null || painting.series === filters.series) &&
      (filters.availability === null || painting.availability === filters.availability),
  );
}

/** The distinct series present in the catalog, in first-seen order. */
export function seriesOf(paintings: Painting[]): string[] {
  const seen = new Set<string>();
  for (const painting of paintings) {
    if (painting.series) seen.add(painting.series);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}
