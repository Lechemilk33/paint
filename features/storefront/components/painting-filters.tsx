'use client';

import { cn } from '@/lib/utils';
import {
  AVAILABILITY_LABEL,
  availabilitySchema,
  type PaintingFilters,
} from '@/lib/paintings/schema';

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
        'focus-visible:ring-ring tracking-label focus-visible:ring-offset-background border px-3 py-1.5 font-mono text-xs whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
 * Two independent filter rows over the catalog. Chips rather than a select:
 * the whole choice set is visible at once, which beats hiding a handful of
 * pieces behind a dropdown. The series row is built from whatever series the
 * catalog actually contains, so adding one in the admin makes a chip appear.
 */
export function PaintingFiltersBar({
  series,
  value,
  onChange,
}: {
  series: string[];
  value: PaintingFilters;
  onChange: (next: PaintingFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {series.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by series"
        >
          <FilterChip
            isActive={value.series === null}
            onClick={() => onChange({ ...value, series: null })}
          >
            All work
          </FilterChip>
          {series.map((name) => (
            <FilterChip
              key={name}
              isActive={value.series === name}
              onClick={() => onChange({ ...value, series: value.series === name ? null : name })}
            >
              {name}
            </FilterChip>
          ))}
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by availability"
      >
        <FilterChip
          isActive={value.availability === null}
          onClick={() => onChange({ ...value, availability: null })}
        >
          Any status
        </FilterChip>
        {availabilitySchema.options.map((option) => (
          <FilterChip
            key={option}
            isActive={value.availability === option}
            onClick={() =>
              onChange({ ...value, availability: value.availability === option ? null : option })
            }
          >
            {AVAILABILITY_LABEL[option]}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
