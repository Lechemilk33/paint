/**
 * Clears prose that was written for the paintings by the person who built this
 * site rather than by the artist.
 *
 * The seeded records carried invented accounts of how each canvas was made
 * ("every spine is a single unbroken pull of the brush"), invented series names
 * and invented shipping terms. None of it came from the studio, so none of it
 * belongs on the studio's shop. Titles, years, sizes, prices and alt text are
 * left alone - those describe the object, not the practice.
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/strip-invented-copy.ts
 */
import { listPaintings, updatePainting } from '@/lib/paintings/repository';
import type { Painting, PaintingInput } from '@/lib/paintings/schema';

function toInput(painting: Painting): PaintingInput {
  const { id, slug, photos, createdAt, updatedAt, ...input } = painting;
  void id, slug, photos, createdAt, updatedAt;
  return input;
}

async function main(): Promise<void> {
  const paintings = await listPaintings();
  if (paintings.length === 0) {
    console.log('No paintings stored.');
    return;
  }

  for (const painting of paintings) {
    const cleared: string[] = [];
    if (painting.story) cleared.push('story');
    if (painting.series) cleared.push('series');
    if (painting.framingShipping) cleared.push('shipping');
    if (painting.blurb) cleared.push('blurb');

    if (cleared.length === 0) {
      console.log(`skip  ${painting.title} (already clean)`);
      continue;
    }

    await updatePainting(painting.id, {
      ...toInput(painting),
      story: '',
      series: '',
      framingShipping: '',
      blurb: '',
    });
    console.log(`clear ${painting.title} -> ${cleared.join(', ')}`);
  }

  console.log('\nThe artist can write their own in the admin.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
