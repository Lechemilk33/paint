'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  BUDGET_LABEL,
  TIMEFRAME_LABEL,
  budgetSchema,
  timeframeSchema,
  type EnquiryKind,
  type EnquiryPainting,
} from '@/lib/enquiries/schema';
import { submitEnquiryAction } from '../actions';
import { EMPTY_ENQUIRY_STATE, SENT_COPY, type EnquiryFormState } from '../form-state';

/** Shared field chrome: label, optional hint, control, and one error slot. */
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
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="tracking-label font-mono text-xs uppercase">
        {label}
        {required ? (
          <span className="text-magenta ml-0.5" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-muted-foreground ml-1 normal-case">(optional)</span>
        )}
      </Label>
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {children}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-magenta text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const FIELD_CLASS =
  'border-input bg-ink/40 focus-visible:border-ring focus-visible:ring-ring/50 rounded-none text-base sm:text-sm';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="tracking-label w-full rounded-none font-mono text-xs uppercase sm:w-auto"
    >
      <Send aria-hidden="true" />
      {pending ? 'Sending...' : label}
    </Button>
  );
}

/**
 * The studio's intake form, in three shapes.
 *
 * A commission asks for a brief, a budget and a timeframe; a question about a
 * piece asks none of that because the piece already answers it. They are one
 * component because everything else - the traps, the error handling, the value
 * echo, the success panel - is identical, and three near-copies of a form is
 * how two of them quietly rot.
 *
 * The form is a plain POST to a server action, so it works before hydration and
 * keeps working if the JavaScript never arrives.
 */
export function EnquiryForm({
  kind,
  paintings = [],
  submitLabel,
  onSent,
  className,
}: {
  kind: EnquiryKind;
  paintings?: EnquiryPainting[];
  submitLabel?: string;
  /** Called once accepted, so a container can clear a cart or close a panel. */
  onSent?: () => void;
  className?: string;
}) {
  const [state, formAction] = useActionState<EnquiryFormState, FormData>(
    submitEnquiryAction,
    EMPTY_ENQUIRY_STATE,
  );
  const formId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const notified = useRef(false);

  useEffect(() => {
    if (stampRef.current) stampRef.current.value = String(Date.now());
  }, [state.status]);

  // Move the reader to the outcome rather than leaving them at the button
  // wondering whether anything happened.
  useEffect(() => {
    if (state.status === 'error') errorRef.current?.focus();
    if (state.status === 'sent') sentRef.current?.focus();
  }, [state.status]);

  useEffect(() => {
    if (state.status === 'sent' && !notified.current) {
      notified.current = true;
      onSent?.();
    }
  }, [state.status, onSent]);

  const err = (field: string) => state.fieldErrors[field];
  const val = (field: string) => state.values[field] ?? '';

  if (state.status === 'sent') {
    const copy = SENT_COPY[kind];
    return (
      <div
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className={cn(
          'border-acid/40 bg-acid/5 flex flex-col items-start gap-4 border p-6 focus:outline-none sm:p-8',
          className,
        )}
      >
        <span className="border-acid/50 text-acid flex size-10 items-center justify-center rounded-full border">
          <Check aria-hidden="true" className="size-5" />
        </span>
        <h2 className="font-poster text-2xl font-extrabold tracking-tight">{copy.title}</h2>
        <p className="text-foreground-secondary max-w-md text-sm leading-relaxed">{copy.body}</p>
        {state.reference ? (
          <p className="text-muted-foreground font-mono text-xs">
            Your reference is{' '}
            <span className="text-voltage tracking-label">{state.reference}</span> - quote it if you
            follow up.
          </p>
        ) : null}
        <Button
          asChild
          variant="outline"
          className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
        >
          <Link href="/store">
            Back to the work
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className={cn('flex flex-col gap-6', className)} noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="paintings" value={JSON.stringify(paintings)} />
      {/* Stamped by the browser after mount, not during render: this component
          is server-rendered too, and a page that gets prerendered would
          otherwise carry a build-time value that is hours stale by the time
          anyone sees it. Left empty when JavaScript never runs, which the
          action treats as "no timing signal" rather than as a failure. */}
      <input ref={stampRef} type="hidden" name="rendered_at" defaultValue="" />

      {/* The trap. Hidden from sight and from screen readers, and taken out of
          the tab order, so no person can reach it - only a script filling every
          input it finds. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${formId}-company`}>Company website</label>
        <input
          id={`${formId}-company`}
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="border-magenta/50 bg-magenta/10 text-magenta border px-4 py-3 text-sm focus:outline-none"
        >
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name" label="Your name" error={err('name')} required>
          <Input
            id="name"
            name="name"
            defaultValue={val('name')}
            autoComplete="name"
            required
            aria-invalid={err('name') ? true : undefined}
            aria-describedby={err('name') ? 'name-error' : undefined}
            className={FIELD_CLASS}
          />
        </Field>
        <Field name="email" label="Email" error={err('email')} required>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={val('email')}
            autoComplete="email"
            required
            aria-invalid={err('email') ? true : undefined}
            aria-describedby={err('email') ? 'email-error' : undefined}
            className={FIELD_CLASS}
          />
        </Field>
      </div>

      {kind === 'commission' ? (
        <>
          <Field
            name="subject"
            label="What would you like painted"
            hint="An animal, a scene, a photograph you want reinterpreted - a line is enough to start."
            error={err('subject')}
            required
          >
            <Input
              id="subject"
              name="subject"
              defaultValue={val('subject')}
              required
              aria-invalid={err('subject') ? true : undefined}
              aria-describedby={err('subject') ? 'subject-error' : undefined}
              className={FIELD_CLASS}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-3">
            <Field name="size" label="Size in mind" error={err('size')}>
              <Input
                id="size"
                name="size"
                placeholder="8 x 10 in"
                defaultValue={val('size')}
                className={FIELD_CLASS}
              />
            </Field>
            <Field name="budget" label="Budget" error={err('budget')}>
              <select
                id="budget"
                name="budget"
                defaultValue={val('budget')}
                className={cn(FIELD_CLASS, 'h-9 w-full border px-3 outline-none')}
              >
                <option value="">No preference</option>
                {budgetSchema.options.map((option) => (
                  <option key={option} value={option}>
                    {BUDGET_LABEL[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="timeframe" label="Timeframe" error={err('timeframe')}>
              <select
                id="timeframe"
                name="timeframe"
                defaultValue={val('timeframe')}
                className={cn(FIELD_CLASS, 'h-9 w-full border px-3 outline-none')}
              >
                <option value="">No preference</option>
                {timeframeSchema.options.map((option) => (
                  <option key={option} value={option}>
                    {TIMEFRAME_LABEL[option]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </>
      ) : null}

      {paintings.length > 0 ? (
        <div className="border-border bg-ink/30 flex flex-col gap-2 border p-4">
          <p className="tracking-label text-muted-foreground font-mono text-xs uppercase">
            {paintings.length === 1 ? 'About this piece' : `About ${paintings.length} pieces`}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {paintings.map((painting) => (
              <li key={painting.id} className="text-foreground-secondary text-sm">
                {painting.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Field
        name="message"
        label="Message"
        hint={
          kind === 'commission'
            ? 'Anything that helps: colours you love, where it will hang, references you have.'
            : undefined
        }
        error={err('message')}
        required
      >
        <Textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={val('message')}
          required
          aria-invalid={err('message') ? true : undefined}
          aria-describedby={err('message') ? 'message-error' : undefined}
          className={FIELD_CLASS}
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton label={submitLabel ?? 'Send to the studio'} />
        <p className="text-muted-foreground text-xs">
          Your address is used to reply and nothing else.
        </p>
      </div>
    </form>
  );
}
