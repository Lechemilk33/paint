'use client';

import { useRef } from 'react';
import { AVAILABILITY_LABEL, availabilitySchema, type Availability } from '@/lib/paintings/schema';
import { setAvailabilityAction } from '../painting-actions';

/**
 * Changes a piece's availability straight from the list. Marking something
 * sold is the single most common edit in the whole admin, and routing it
 * through the full editor for one field is friction the studio does not need.
 *
 * The select submits its own form on change, so it works as a plain form post
 * before hydration and needs no client state of its own.
 */
export function AvailabilitySelect({
  paintingId,
  value,
  label,
}: {
  paintingId: string;
  value: Availability;
  label: string;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={setAvailabilityAction}>
      <input type="hidden" name="id" value={paintingId} />
      <label className="sr-only" htmlFor={`availability-${paintingId}`}>
        Availability for {label}
      </label>
      <select
        id={`availability-${paintingId}`}
        name="availability"
        defaultValue={value}
        onChange={() => form.current?.requestSubmit()}
        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-md border px-2 text-xs outline-none focus-visible:ring-[3px]"
      >
        {availabilitySchema.options.map((option) => (
          <option key={option} value={option}>
            {AVAILABILITY_LABEL[option]}
          </option>
        ))}
      </select>
      {/* Pre-hydration fallback: without JS the change handler never fires. */}
      <noscript>
        <button type="submit" className="ml-1 text-xs underline">
          Update
        </button>
      </noscript>
    </form>
  );
}
