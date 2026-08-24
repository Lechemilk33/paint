'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { paintingListOptions, seriesListOptions } from '../queries';
import type { Painting } from '../schema';
import { PaintingCard } from './painting-card';
import { SpikeRule } from './spike-rule';

/** The rest of the series this piece belongs to. Renders nothing when it is the
 *  only one - an empty "more like this" rail is worse than no rail. */
export function RelatedPaintings({ painting }: { painting: Painting }) {
  const { data: paintings } = useSuspenseQuery(paintingListOptions());
  const { data: series } = useSuspenseQuery(seriesListOptions());

  const siblings = paintings.filter(
    (entry) => entry.seriesId === painting.seriesId && entry.id !== painting.id,
  );
  if (siblings.length === 0) return null;

  const seriesName = series.find((entry) => entry.id === painting.seriesId)?.name ?? 'this series';

  return (
    <section className="mt-24 flex flex-col gap-8">
      <SpikeRule className="text-voltage/40" />
      <h2 className="font-poster text-2xl font-extrabold tracking-tight sm:text-3xl">
        More from {seriesName}
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {siblings.map((sibling) => (
          <PaintingCard key={sibling.id} painting={sibling} />
        ))}
      </div>
    </section>
  );
}
