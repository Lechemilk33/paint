'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createInquiry } from '@/lib/inquiries/repository';
import { inquiryPaintingSchema, inquirySubmissionSchema } from '@/lib/inquiries/schema';
import type { InquiryFormState } from './form-state';

/**
 * The honeypot. A field no human ever sees, and so never fills in; the crude
 * bots that submit every form on the internet fill everything. Named like
 * something worth filling rather than `honeypot`, because the obvious name is
 * the one a scraper skips.
 */
const TRAP_FIELD = 'company_website';

/**
 * Nobody reads a form, composes a message and submits it in under three
 * seconds. The form stamps its render time into a hidden field and this checks
 * the gap - which costs a real visitor nothing and stops the scripted
 * submissions the honeypot misses.
 *
 * The stamp is not signed. Forging it is trivial for anyone who looks, and
 * that is fine: the goal is to stop indiscriminate bots, not a determined
 * person, and the cost of being wrong is one unwanted message in an inbox.
 *
 * A missing stamp is not a failure. It means JavaScript never ran, and a
 * visitor without it deserves to reach the studio; the honeypot still applies.
 */
const MIN_COMPOSE_MS = 3000;

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

/** The text fields echoed back on a failed submit, so nothing typed is lost. */
const ECHOED = ['name', 'email', 'message', 'subject', 'size', 'budget', 'timeframe'] as const;

function echo(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of ECHOED) {
    const value = formData.get(field);
    if (typeof value === 'string' && value !== '') values[field] = value;
  }
  return values;
}

/**
 * Receives an inquiry from any of the three public entry points.
 *
 * The pieces an inquiry refers to arrive as a JSON blob in a hidden field
 * rather than as ids to look up, because the browser is not trusted to name a
 * price: the field is parsed and then, for anything with an id, overwritten
 * from the catalog. What a visitor sends can only ever decide *which* pieces
 * are attached, never what they cost.
 */
export async function submitInquiryAction(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const values = echo(formData);

  // Silently accept and discard: telling a bot it was caught teaches it.
  if (String(formData.get(TRAP_FIELD) ?? '') !== '') {
    return { status: 'sent', error: null, fieldErrors: {}, values: {}, reference: null };
  }

  const rawStamp = String(formData.get('rendered_at') ?? '');
  if (rawStamp !== '') {
    const age = Date.now() - Number(rawStamp);
    if (Number.isFinite(age) && age >= 0 && age < MIN_COMPOSE_MS) {
      return {
        status: 'error',
        error: 'That was sent a little too fast. Give it a moment and try again.',
        fieldErrors: {},
        values,
        reference: null,
      };
    }
  }

  let paintings: unknown = [];
  try {
    const raw = String(formData.get('paintings') ?? '[]');
    paintings = JSON.parse(raw);
  } catch {
    paintings = [];
  }

  const parsed = inquirySubmissionSchema.safeParse({
    kind: formData.get('kind'),
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    subject: formData.get('subject') ?? '',
    size: formData.get('size') ?? '',
    budget: formData.get('budget') || undefined,
    timeframe: formData.get('timeframe') || undefined,
    paintings: inquiryPaintingSchema.array().catch([]).parse(paintings),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      error: 'Some details need another look.',
      fieldErrors: toFieldErrors(parsed.error),
      values,
      reference: null,
    };
  }

  // Re-read every referenced piece from the catalog so the stored title and
  // price are the studio's, not the browser's.
  const { getPaintingById } = await import('@/lib/paintings/repository');
  const verified = [];
  for (const candidate of parsed.data.paintings) {
    const painting = await getPaintingById(candidate.id);
    if (!painting) continue;
    verified.push({
      id: painting.id,
      title: painting.title,
      slug: painting.slug,
      priceCents: painting.priceCents,
    });
  }

  try {
    const inquiry = await createInquiry({ ...parsed.data, paintings: verified });
    revalidatePath('/admin/inquiries');
    revalidatePath('/admin');
    return {
      status: 'sent',
      error: null,
      fieldErrors: {},
      values: {},
      reference: inquiry.reference,
    };
  } catch (cause) {
    console.error('Could not store inquiry', cause);
    return {
      status: 'error',
      error: 'Something went wrong at this end and the message was not saved. Please try again.',
      fieldErrors: {},
      values,
      reference: null,
    };
  }
}
