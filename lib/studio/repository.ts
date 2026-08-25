import 'server-only';
import { cache } from 'react';
import { RECORDS, blobStore } from '@/lib/storage/blobs';
import { EMPTY_STUDIO, studioSchema, type Studio } from './schema';

/** One small document beside the catalog and the inbox. */
const STUDIO_KEY = 'studio';

/**
 * The studio's own copy.
 *
 * Wrapped in React's `cache` because nearly every page reads it - the header,
 * the footer and usually the body too - and without it a single render would
 * make three round trips for the same few hundred bytes.
 *
 * A malformed stored document falls back to empty rather than throwing: the
 * shop should still sell paintings if someone's tagline is the wrong shape.
 */
export const getStudio = cache(async (): Promise<Studio> => {
  const stored = await blobStore(RECORDS).getJSON<unknown>(STUDIO_KEY);
  if (!stored) return EMPTY_STUDIO;

  const parsed = studioSchema.safeParse(stored);
  if (!parsed.success) {
    console.error('Stored studio settings do not match the schema; using empty.', parsed.error);
    return EMPTY_STUDIO;
  }
  return parsed.data;
});

export async function saveStudio(studio: Studio): Promise<void> {
  await blobStore(RECORDS).setJSON(STUDIO_KEY, studio);
}
