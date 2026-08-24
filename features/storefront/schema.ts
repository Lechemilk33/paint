import { z } from 'zod';

/**
 * Every piece is a one-off original, so availability is a three-state lifecycle
 * rather than a stock count: it is on the wall, someone has a hold on it, or it
 * is gone. Nothing in the store can ever have a quantity above one.
 */
export const paintingStatusSchema = z.enum(['available', 'reserved', 'sold']);
export type PaintingStatus = z.infer<typeof paintingStatusSchema>;

export const PAINTING_STATUS_LABEL: Record<PaintingStatus, string> = {
  available: 'Available',
  reserved: 'On hold',
  sold: 'Sold',
};

/** Grouping used by the catalog filters. Series are curatorial, not structural. */
export const seriesSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  blurb: z.string().min(1),
});
export type Series = z.infer<typeof seriesSchema>;

export const paintingSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int(),
  seriesId: z.string().min(1),
  medium: z.string().min(1),
  /** Canvas size in inches, width then height. */
  widthIn: z.number().positive(),
  heightIn: z.number().positive(),
  /** Minor units, so no float ever touches a price. */
  priceCents: z.number().int().nonnegative(),
  status: paintingStatusSchema,
  /** One line for the card, a paragraph for the detail page. */
  blurb: z.string().min(1),
  story: z.string().min(1),
  image: z.object({
    src: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().min(1),
  }),
});
export type Painting = z.infer<typeof paintingSchema>;

/** Filter state for the catalog grid. `null` means "no filter applied". */
export interface PaintingFilters {
  seriesId: string | null;
  status: PaintingStatus | null;
}

export const NO_PAINTING_FILTERS: PaintingFilters = { seriesId: null, status: null };

export function filterPaintings(paintings: Painting[], filters: PaintingFilters): Painting[] {
  return paintings.filter(
    (painting) =>
      (filters.seriesId === null || painting.seriesId === filters.seriesId) &&
      (filters.status === null || painting.status === filters.status),
  );
}
