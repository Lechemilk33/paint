import type { Painting } from '@/lib/paintings/schema';
import { PaintingCard } from './painting-card';
import { SpikeRule } from './spike-rule';

/** The rest of the series this piece belongs to. Renders nothing when it is the
 *  only one, or when the piece has no series - an empty "more like this" rail is
 *  worse than no rail. */
export function RelatedPaintings({
  painting,
  paintings,
}: {
  painting: Painting;
  paintings: Painting[];
}) {
  if (!painting.series) return null;

  const siblings = paintings.filter(
    (entry) => entry.series === painting.series && entry.id !== painting.id,
  );
  if (siblings.length === 0) return null;

  return (
    <section className="mt-24 flex flex-col gap-8">
      <SpikeRule className="text-voltage/40" />
      <h2 className="font-poster text-2xl font-extrabold tracking-tight sm:text-3xl">
        More from {painting.series}
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {siblings.map((sibling) => (
          <PaintingCard key={sibling.id} painting={sibling} />
        ))}
      </div>
    </section>
  );
}
