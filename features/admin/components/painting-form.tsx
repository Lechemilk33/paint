'use client';

import { useActionState, useEffect, useRef } from 'react';
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
 * posting to a server action - the one piece of cross-field behaviour, the
 * print price appearing with the print switch, is done in CSS, so a controlled
 * form library would add a hydration cost and buy nothing.
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
      {/* block rather than the primitive's flex, so a long label wraps as a
          sentence instead of one word per line beside its required marker. */}
      <Label htmlFor={name} className="block leading-tight">
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

  /**
   * What a field should fall back to.
   *
   * React resets the form once the action resolves, restoring every input to
   * the default it was rendered with - so on a rejected submission the values
   * that came back take precedence over the stored record. Without that, one
   * bad field would empty the whole form and the typing would have to be done
   * again.
   */
  const val = (field: string, stored?: string | number) =>
    state.values[field] ?? (stored === undefined ? undefined : String(stored));
  const checked = (field: string, stored: boolean) =>
    Object.keys(state.values).length > 0 ? state.values[field] === 'on' : stored;

  /**
   * Selects need putting back by hand, where an input or a textarea does not.
   *
   * A form reset restores each control to its DOM attribute, and React writes
   * a select's default through the element's `value` property rather than as a
   * `selected` attribute on an option - so there is no attribute for the reset
   * to restore and every select drops to its first option. Rendering the right
   * default does not help: the value React would write is the value already
   * there, so nothing is re-applied. Writing them back after the reset is what
   * makes the edition and the availability survive a rejected submission.
   */
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    for (const [name, value] of Object.entries(state.values)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLSelectElement) field.value = value;
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
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
          <Input id="title" name="title" defaultValue={val('title', painting?.title)} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="year" label="Year completed" error={err('year')} required>
            <Input
              id="year"
              name="year"
              type="number"
              inputMode="numeric"
              defaultValue={val('year', painting?.year)}
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
              defaultValue={val('series', painting?.series)}
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
          <Input id="medium" name="medium" defaultValue={val('medium', painting?.medium)} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="heightIn" label="Height (in)" error={err('heightIn')} required>
            <Input
              id="heightIn"
              name="heightIn"
              type="number"
              step="0.25"
              inputMode="decimal"
              defaultValue={val('heightIn', painting?.heightIn)}
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
              defaultValue={val('widthIn', painting?.widthIn)}
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
              defaultValue={val('priceUsd', painting ? (painting.priceCents / 100).toFixed(2) : undefined)}
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
              defaultValue={val('edition', painting?.edition ?? 'original')}
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
              defaultValue={val('availability', painting?.availability ?? 'available')}
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
          name="shippingUsd"
          label="Shipping (USD)"
          hint="Added at checkout, on top of the price. Blank or zero means shipping is included."
          error={err('shippingUsd')}
        >
          <Input
            id="shippingUsd"
            name="shippingUsd"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            defaultValue={val(
              'shippingUsd',
              painting ? (painting.shippingCents / 100).toFixed(2) : undefined,
            )}
          />
        </Field>

        <Field
          name="instantCheckout"
          label="Instant checkout"
          hint="Off by default. Anything left off still takes inquiries, which is what every piece does. Check the price and the shipping above before turning it on."
          error={err('instantCheckout')}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              id="instantCheckout"
              name="instantCheckout"
              type="checkbox"
              defaultChecked={checked('instantCheckout', painting?.instantCheckout ?? false)}
              className="accent-primary size-4"
            />
            Let people buy this outright, by card
          </label>
        </Field>

        {/* The price belongs to the switch above it, so it is revealed by that
            checkbox rather than by React state: a CSS `has` selector cannot go
            stale when the form comes back from a rejected submission, and it
            works before any JavaScript has loaded. The field keeps posting
            while hidden, so a price typed and then switched off is still there
            when prints are switched back on. */}
        <div className="group/prints space-y-4">
          <Field
            name="printsAvailable"
            label="Prints"
            hint="Off by default. Turn it on only for pieces you are willing and able to reproduce."
            error={err('printsAvailable')}
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                id="printsAvailable"
                name="printsAvailable"
                type="checkbox"
                defaultChecked={checked('printsAvailable', painting?.printsAvailable ?? false)}
                className="accent-primary size-4"
              />
              Let visitors request a print of this piece
            </label>
          </Field>

          <div className="border-border ml-6 hidden border-l pl-4 group-has-[#printsAvailable:checked]/prints:block">
            <Field
              name="printPriceUsd"
              label="Price per print (USD)"
              hint="What one print costs, before any framing. Leave blank to quote each request by hand - the page then says the studio prices it on reply."
              error={err('printPriceUsd')}
            >
              <Input
                id="printPriceUsd"
                name="printPriceUsd"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="120.00"
                defaultValue={val(
                  'printPriceUsd',
                  painting && painting.printPriceCents > 0
                    ? (painting.printPriceCents / 100).toFixed(2)
                    : undefined,
                )}
              />
            </Field>
          </div>
        </div>

        <Field
          name="framingShipping"
          label="Framing and shipping"
          hint="Only if this piece differs from your usual terms in Studio settings. Blank uses those."
          error={err('framingShipping')}
        >
          <Textarea
            id="framingShipping"
            name="framingShipping"
            rows={2}
            defaultValue={val('framingShipping', painting?.framingShipping)}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Words</h2>

        <Field
          name="blurb"
          label="One-line description"
          hint="The short line under the title. Left out of the page entirely when blank."
          error={err('blurb')}
        >
          <Textarea id="blurb" name="blurb" rows={2} defaultValue={val('blurb', painting?.blurb)} />
        </Field>

        <Field
          name="story"
          label="About this painting"
          hint="In your own words - how it was made, what it is. No section appears until you write one."
          error={err('story')}
        >
          <Textarea id="story" name="story" rows={7} defaultValue={val('story', painting?.story)} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Studio notes</h2>
        <p className="text-muted-foreground text-xs">
          Never shown on the public site.
        </p>

        <Field name="driveFolder" label="Photo folder name in Drive" error={err('driveFolder')}>
          <Input
            id="driveFolder"
            name="driveFolder"
            defaultValue={val('driveFolder', painting?.driveFolder)}
          />
        </Field>

        <Field name="notes" label="Anything else worth knowing" error={err('notes')}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={val('notes', painting?.notes)} />
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
