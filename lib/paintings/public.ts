import 'server-only';
import { cache } from 'react';
import { listPaintings } from './repository';
import type { Painting } from './schema';

/**
 * The catalog as the public site sees it.
 *
 * A piece with no photograph is withheld: the storefront is a wall of images,
 * and a card with an empty frame reads as a broken page rather than as work in
 * progress. The admin says so explicitly when a piece is created, so this is a
 * visible rule rather than a silent one.
 *
 * Wrapped in React's `cache` so a route that needs the catalog in its layout,
 * its page, and its metadata reads storage once per request rather than three
 * times.
 */
export const listVisiblePaintings = cache(async (): Promise<Painting[]> => {
  const paintings = await listPaintings();
  return paintings.filter((painting) => painting.photos.length > 0);
});

export async function getVisiblePaintingBySlug(slug: string): Promise<Painting | null> {
  const paintings = await listVisiblePaintings();
  return paintings.find((painting) => painting.slug === slug) ?? null;
}
