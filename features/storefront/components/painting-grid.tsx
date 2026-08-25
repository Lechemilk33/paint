'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  NO_PAINTING_FILTERS,
  filterPaintings,
  seriesOf,
  type Painting,
  type PaintingFilters,
} from '@/lib/paintings/schema';
import { PaintingCard } from './painting-card';
import { PaintingFiltersBar } from './painting-filters';

/**
 * The catalog. The list is rendered on the server and handed down as a prop, so
 * the first paint already has the work in it; filtering then runs over that
 * array in the browser and no chip costs a request.
 */
export function PaintingGrid({ paintings }: { paintings: Painting[] }) {
  const [filters, setFilters] = useState<PaintingFilters>(NO_PAINTING_FILTERS);

  const series = useMemo(() => seriesOf(paintings), [paintings]);
  const visible = useMemo(() => filterPaintings(paintings, filters), [paintings, filters]);

  return (
    <div className="flex flex-col gap-8">
      <PaintingFiltersBar series={series} value={filters} onChange={setFilters} />

      {visible.length === 0 ? (
        <div className="border-border flex flex-col items-start gap-3 border border-dashed p-10">
          <p className="font-poster text-xl font-extrabold">No matches</p>
          <p className="text-muted-foreground max-w-md text-sm">
            Nothing matches this combination. Clear the filters to see everything.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilters(NO_PAINTING_FILTERS)}
            className="tracking-label rounded-none font-mono text-xs uppercase"
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
