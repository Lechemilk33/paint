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
  PRINT_FINISH_LABEL,
  TIMEFRAME_LABEL,
  budgetSchema,
  isCommissionShaped,
  printFinishSchema,
  timeframeSchema,
  type InquiryKind,
  type InquiryPainting,
} from '@/lib/inquiries/schema';
import { submitInquiryAction } from '../actions';
import { EMPTY_INQUIRY_STATE, SENT_COPY, type InquiryFormState } from '../form-state';

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
      {/* block, not the primitive's flex: as flex items the label text and the
          (optional) marker each shrink to their own min-content, which stacks a
          three-word label one word per line in a narrow column. */}
      <Label htmlFor={name} className="tracking-label block font-mono text-xs leading-tight uppercase">
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
 * What the attached canvases are doing in this particular request. A commission
 * has none; a question or a purchase is about them; a similar request works
 * from one; a print reproduces one.
 */
const ATTACHED_COPY: Record<InquiryKind, { heading: (n: number) => string; note?: string }> = {
  commission: { heading: (n) => (n === 1 ? 'About this piece' : `About ${n} pieces`) },
  piece: { heading: (n) => (n === 1 ? 'About this piece' : `About ${n} pieces`) },
  purchase: { heading: (n) => (n === 1 ? 'About this piece' : `About ${n} pieces`) },
  similar: {
    heading: () => 'Working from',
    note: 'A new painting in the spirit of this one, not a copy of it. Price and timing depend on what you ask for.',
  },
  print: {
    heading: () => 'Printing',
    note: 'A reproduction, not the original canvas, and priced separately from it. The studio quotes it when it replies.',
  },
};

/**
 * What the message field is actually asking for, which is not the same question
 * in each shape. A commission has nothing to look at yet. A similar request has
 * a canvas in front of it and needs to say what should change. A print request
 * is already fully described by the fields above it, so its message is genuinely
 * optional - see the schema.
 */
const MESSAGE_COPY: Record<InquiryKind, { label: string; hint?: string; required: boolean }> = {
  commission: {
    label: 'Message',
    hint: 'Anything that helps: colors you love, where it will hang, references you have.',
    required: true,
  },
  piece: { label: 'Message', required: true },
  purchase: { label: 'Message', required: true },
  similar: {
    label: 'What you would like changed',
    hint: 'Say what should carry over from the piece above and what should not - subject, palette, scale, mood.',
    required: true,
  },
  print: {
    label: 'Anything else',
    hint: 'Only if there is something to say. A deadline, where it will hang, a question about the paper.',
    required: false,
  },
};

/**
 * The studio's intake form, in five shapes.
 *
 * A commission asks for a brief, a budget and a timeframe; a request for
 * something similar asks the same, minus the brief, because the attached canvas
 * is the brief; a print asks for a size, a finish and a count; a question or a
 * purchase asks none of it, because the piece already answers it. They are one
 * component because everything else - the traps, the error handling, the value
 * echo, the success panel - is identical, and five near-copies of a form is how
 * four of them quietly rot.
 *
 * The form is a plain POST to a server action, so it works before hydration and
 * keeps working if the JavaScript never arrives.
 */
export function InquiryForm({
  kind,
  paintings = [],
  submitLabel,
  onSent,
  className,
}: {
  kind: InquiryKind;
  paintings?: InquiryPainting[];
  submitLabel?: string;
  /** Called once accepted, so a container can clear a cart or close a panel. */
  onSent?: () => void;
  className?: string;
}) {
  const [state, formAction] = useActionState<InquiryFormState, FormData>(
    submitInquiryAction,
    EMPTY_INQUIRY_STATE,
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
      ) : null}

      {/* A new painting either way, so both shapes ask the three questions that
          decide whether the studio can take it on. */}
      {isCommissionShaped(kind) ? (
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
      ) : null}

      {kind === 'print' ? (
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Free text, not a menu. How large this image can be printed depends
              on the photograph behind it, and the studio has published no size
              list - so the form asks what you want rather than offering
              dimensions nobody has committed to. */}
          <Field
            name="printSize"
            label="Size you want"
            hint="Roughly is fine. The studio will say what this image can actually be printed at."
            error={err('printSize')}
          >
            <Input
              id="printSize"
              name="printSize"
              defaultValue={val('printSize')}
              aria-invalid={err('printSize') ? true : undefined}
              aria-describedby={err('printSize') ? 'printSize-error' : undefined}
              className={FIELD_CLASS}
            />
          </Field>
          <Field name="printFinish" label="Printed on" error={err('printFinish')}>
            <select
              id="printFinish"
              name="printFinish"
              defaultValue={val('printFinish') || 'either'}
              className={cn(FIELD_CLASS, 'h-9 w-full border px-3 outline-none')}
            >
              {printFinishSchema.options.map((option) => (
                <option key={option} value={option}>
                  {PRINT_FINISH_LABEL[option]}
                </option>
              ))}
            </select>
          </Field>
          <Field name="printQuantity" label="How many" error={err('printQuantity')} required>
            <Input
              id="printQuantity"
              name="printQuantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              step={1}
              defaultValue={val('printQuantity') || '1'}
              required
              aria-invalid={err('printQuantity') ? true : undefined}
              aria-describedby={err('printQuantity') ? 'printQuantity-error' : undefined}
              className={FIELD_CLASS}
            />
          </Field>
        </div>
      ) : null}

      {paintings.length > 0 ? (
        <div className="border-border bg-ink/30 flex flex-col gap-2 border p-4">
          <p className="tracking-label text-muted-foreground font-mono text-xs uppercase">
            {ATTACHED_COPY[kind].heading(paintings.length)}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {paintings.map((painting) => (
              <li key={painting.id} className="text-foreground-secondary text-sm">
                {painting.title}
              </li>
            ))}
          </ul>
          {ATTACHED_COPY[kind].note ? (
            <p className="text-muted-foreground text-xs">{ATTACHED_COPY[kind].note}</p>
          ) : null}
        </div>
      ) : null}

      {/* Only reachable if the reference was lost between page and submit, so it
          has nowhere else to appear: the field it belongs to is hidden. */}
      {err('paintings') ? (
        <p role="alert" className="text-magenta text-xs">
          {err('paintings')}
        </p>
      ) : null}

      <Field
        name="message"
        label={MESSAGE_COPY[kind].label}
        hint={MESSAGE_COPY[kind].hint}
        error={err('message')}
        required={MESSAGE_COPY[kind].required}
      >
        <Textarea
          id="message"
          name="message"
          rows={MESSAGE_COPY[kind].required ? 6 : 3}
          defaultValue={val('message')}
          required={MESSAGE_COPY[kind].required}
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
