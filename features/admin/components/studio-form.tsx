'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Studio } from '@/lib/studio/schema';
import { EMPTY_FORM_STATE, type FormState } from '../form-state';
import { saveStudioAction } from '../studio-actions';

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
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

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </Button>
  );
}

/**
 * The studio's own words about itself.
 *
 * Every field here is optional and every one starts blank. The storefront
 * omits whatever is empty rather than substituting anything, which is the
 * whole point: no part of this site should describe a practice on the artist's
 * behalf.
 */
export function StudioForm({ studio }: { studio: Studio }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveStudioAction,
    EMPTY_FORM_STATE,
  );
  const err = (field: string) => state.fieldErrors[field];

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Identity</h2>
        <Field name="name" label="Studio name" hint="Shown in the header and footer." error={err('name')}>
          <Input id="name" name="name" defaultValue={studio.name} />
        </Field>
        <Field
          name="tagline"
          label="Tagline"
          hint="One line under the wordmark in the footer. Leave blank for none."
          error={err('tagline')}
        >
          <Input id="tagline" name="tagline" defaultValue={studio.tagline} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">About</h2>
        <Field
          name="about"
          label="About the studio"
          hint="In your own words. The About section on the store home does not appear at all until this is written."
          error={err('about')}
        >
          <Textarea id="about" name="about" rows={6} defaultValue={studio.about} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Contact and terms</h2>
        <Field
          name="contactEmail"
          label="Contact email"
          hint="Shown in the footer and used as the reply-to on inquiries."
          error={err('contactEmail')}
        >
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={studio.contactEmail} />
        </Field>
        <Field
          name="responseTime"
          label="Usual reply time"
          hint='Free text, for example "within a week". Blank means the site promises nothing.'
          error={err('responseTime')}
        >
          <Input id="responseTime" name="responseTime" defaultValue={studio.responseTime} />
        </Field>
        <Field
          name="shipping"
          label="Framing, packing and shipping"
          hint="How work actually leaves the studio. Shown on every painting that has no shipping note of its own."
          error={err('shipping')}
        >
          <Textarea id="shipping" name="shipping" rows={3} defaultValue={studio.shipping} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Marquee</h2>
        <Field
          name="marquee"
          label="Scrolling phrases"
          hint="One per line, up to twelve. The band under the hero is hidden entirely when this is empty."
          error={err('marquee')}
        >
          <Textarea
            id="marquee"
            name="marquee"
            rows={5}
            defaultValue={studio.marquee.join('\n')}
            placeholder={'Acrylic on canvas\nOne of each'}
          />
        </Field>
      </section>

      <div className="border-border flex items-center gap-3 border-t pt-6">
        <SaveButton />
      </div>
    </form>
  );
}
