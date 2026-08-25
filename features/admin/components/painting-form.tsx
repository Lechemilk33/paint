'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AVAILABILITY_LABEL,
  EDITION_LABEL,
  availabilitySchema,
  editionSchema,
  type Painting,
} from '@/lib/paintings/schema';
import { EMPTY_FORM_STATE, type FormState } from '../form-state';
import { createPaintingAction, updatePaintingAction } from '../painting-actions';

/**
 * One field, one label, one error slot. Written out rather than pulled from
 * react-hook-form because every field here is a plain uncontrolled input
 * posting to a server action - there is no cross-field logic, no dynamic
 * array, and nothing to keep in sync, so a controlled form library would add a
 * hydration cost and buy nothing.
 */
function Field({
  name,
  label,
  hint,
  error,
  required,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {children}
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : isNew ? 'Create painting' : 'Save changes'}
    </Button>
  );
}

export function PaintingForm({ painting }: { painting?: Painting }) {
  const isNew = !painting;
  const [state, formAction] = useActionState<FormState, FormData>(
    isNew ? createPaintingAction : updatePaintingAction,
    EMPTY_FORM_STATE,
  );
  const err = (field: string) => state.fieldErrors[field];

  return (
    <form action={formAction} className="space-y-8">
      {painting ? <input type="hidden" name="id" value={painting.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">The piece</h2>

        <Field name="title" label="Painting title" error={err('title')} required>
          <Input id="title" name="title" defaultValue={painting?.title} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="year" label="Year completed" error={err('year')} required>
            <Input
              id="year"
              name="year"
              type="number"
              inputMode="numeric"
              defaultValue={painting?.year}
              required
            />
          </Field>
          <Field
            name="series"
            label="Series or collection"
            hint="Leave blank if the piece stands on its own."
            error={err('series')}
          >
            <Input
              id="series"
              name="series"
              defaultValue={painting?.series}
              placeholder="Night Fauna"
            />
          </Field>
        </div>

        <Field
          name="medium"
          label="Medium"
          hint="For example: acrylic on stretched canvas."
          error={err('medium')}
          required
        >
          <Input id="medium" name="medium" defaultValue={painting?.medium} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="heightIn" label="Height (in)" error={err('heightIn')} required>
            <Input
              id="heightIn"
              name="heightIn"
              type="number"
              step="0.25"
              inputMode="decimal"
              defaultValue={painting?.heightIn}
              required
            />
          </Field>
          <Field name="widthIn" label="Width (in)" error={err('widthIn')} required>
            <Input
              id="widthIn"
              name="widthIn"
              type="number"
              step="0.25"
              inputMode="decimal"
              defaultValue={painting?.widthIn}
              required
            />
          </Field>
          <Field name="priceUsd" label="Price (USD)" error={err('priceUsd')} required>
            <Input
              id="priceUsd"
              name="priceUsd"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              defaultValue={painting ? (painting.priceCents / 100).toFixed(2) : undefined}
              required
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">How it is sold</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="edition" label="Edition" error={err('edition')} required>
            <select
              id="edition"
              name="edition"
              defaultValue={painting?.edition ?? 'original'}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              {editionSchema.options.map((option) => (
                <option key={option} value={option}>
                  {EDITION_LABEL[option]}
                </option>
              ))}
            </select>
          </Field>
          <Field name="availability" label="Availability" error={err('availability')} required>
            <select
              id="availability"
              name="availability"
              defaultValue={painting?.availability ?? 'available'}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              {availabilitySchema.options.map((option) => (
                <option key={option} value={option}>
                  {AVAILABILITY_LABEL[option]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          name="framingShipping"
          label="Framing and shipping"
          error={err('framingShipping')}
          required
        >
          <Textarea
            id="framingShipping"
            name="framingShipping"
            rows={2}
            defaultValue={painting?.framingShipping}
            placeholder="Unframed, shipped flat in a rigid mailer."
            required
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Words</h2>

        <Field
          name="blurb"
          label="One-line description"
          hint="The short line that sits under the title on the site."
          error={err('blurb')}
          required
        >
          <Textarea id="blurb" name="blurb" rows={2} defaultValue={painting?.blurb} required />
        </Field>

        <Field
          name="story"
          label="About this painting"
          hint="The longer paragraph on the detail page."
          error={err('story')}
          required
        >
          <Textarea id="story" name="story" rows={7} defaultValue={painting?.story} required />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Studio notes</h2>
        <p className="text-muted-foreground text-xs">
          Never shown on the public site.
        </p>

        <Field name="driveFolder" label="Photo folder name in Drive" error={err('driveFolder')}>
          <Input id="driveFolder" name="driveFolder" defaultValue={painting?.driveFolder} />
        </Field>

        <Field name="notes" label="Anything else worth knowing" error={err('notes')}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={painting?.notes} />
        </Field>
      </section>

      <div className="border-border flex items-center gap-3 border-t pt-6">
        <SaveButton isNew={isNew} />
        <Button asChild variant="ghost">
          <Link href="/admin">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
