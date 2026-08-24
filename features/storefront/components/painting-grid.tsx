'use client';

import { useMemo, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { paintingListOptions, seriesListOptions } from '../queries';
import { filterPaintings, NO_PAINTING_FILTERS, type PaintingFilters } from '../schema';
import { PaintingCard } from './painting-card';
import { PaintingFiltersBar } from './painting-filters';

/**
 * The catalog. Both queries are prefetched on the server and consumed here with
 * useSuspenseQuery, so the first paint already has the work in it. Filtering
 * runs over the cached array - there is no request behind a chip.
 */
export function PaintingGrid() {
  const { data: paintings } = useSuspenseQuery(paintingListOptions());
  const { data: series } = useSuspenseQuery(seriesListOptions());
  const [filters, setFilters] = useState<PaintingFilters>(NO_PAINTING_FILTERS);

  const visible = useMemo(() => filterPaintings(paintings, filters), [paintings, filters]);
  const activeSeries = series.find((entry) => entry.id === filters.seriesId) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <PaintingFiltersBar series={series} value={filters} onChange={setFilters} />

      {activeSeries ? (
        <p className="text-foreground-secondary max-w-2xl text-sm leading-relaxed">
          {activeSeries.blurb}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="border-border flex flex-col items-start gap-3 border border-dashed p-10">
          <p className="font-poster text-xl font-extrabold">Nothing in that corner</p>
          <p className="text-muted-foreground max-w-md text-sm">
            No piece matches this combination right now. Clear the filters to see the whole wall.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilters(NO_PAINTING_FILTERS)}
            className="rounded-none font-mono text-xs tracking-label uppercase"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {visible.length} of {paintings.length} pieces shown
          </p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((painting, index) => (
              <PaintingCard key={painting.id} painting={painting} priority={index < 3} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
