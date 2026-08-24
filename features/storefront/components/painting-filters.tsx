'use client';

import { cn } from '@/lib/utils';
import { PAINTING_STATUS_LABEL, type PaintingFilters, type Series } from '../schema';

const STATUS_ORDER = ['available', 'reserved', 'sold'] as const;

function FilterChip({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'focus-visible:ring-ring border px-3 py-1.5 font-mono text-xs tracking-label whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        isActive
          ? 'border-magenta bg-magenta text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-voltage/60 hover:text-voltage',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Two independent filter rows over the cached catalog. Chips rather than a
 * select: with three series and three states the whole choice set is visible at
 * once, which beats hiding five pieces behind a dropdown.
 */
export function PaintingFiltersBar({
  series,
  value,
  onChange,
}: {
  series: Series[];
  value: PaintingFilters;
  onChange: (next: PaintingFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by series">
        <FilterChip
          isActive={value.seriesId === null}
          onClick={() => onChange({ ...value, seriesId: null })}
        >
          All work
        </FilterChip>
        {series.map((entry) => (
          <FilterChip
            key={entry.id}
            isActive={value.seriesId === entry.id}
            onClick={() =>
              onChange({ ...value, seriesId: value.seriesId === entry.id ? null : entry.id })
            }
          >
            {entry.name}
          </FilterChip>
        ))}
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by availability"
      >
        <FilterChip
          isActive={value.status === null}
          onClick={() => onChange({ ...value, status: null })}
        >
          Any status
        </FilterChip>
        {STATUS_ORDER.map((status) => (
          <FilterChip
            key={status}
            isActive={value.status === status}
            onClick={() => onChange({ ...value, status: value.status === status ? null : status })}
          >
            {PAINTING_STATUS_LABEL[status]}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
