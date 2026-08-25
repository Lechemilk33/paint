import { z } from 'zod';

/**
 * Why someone got in touch. The three routes into the studio's inbox are
 * genuinely different conversations - a commission is a brief, a question is
 * about one canvas, a purchase enquiry is a list of pieces someone wants to
 * buy - so they are one record with a discriminating kind rather than three
 * tables, which keeps the inbox a single ordered stream.
 */
export const enquiryKindSchema = z.enum(['commission', 'piece', 'purchase']);
export type EnquiryKind = z.infer<typeof enquiryKindSchema>;

export const ENQUIRY_KIND_LABEL: Record<EnquiryKind, string> = {
  commission: 'Commission',
  piece: 'Question',
  purchase: 'Purchase',
};

/**
 * Where a conversation has got to. `new` is the unread state and drives the
 * badge; opening an enquiry moves it to `open`, so the badge counts things
 * genuinely unseen rather than things merely unfinished.
 */
export const enquiryStatusSchema = z.enum(['new', 'open', 'replied', 'archived']);
export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>;

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: 'New',
  open: 'Open',
  replied: 'Replied',
  archived: 'Archived',
};

/** Budget bands rather than a number: a range is what people actually know. */
export const budgetSchema = z.enum(['under_500', '500_1000', '1000_2500', '2500_plus', 'unsure']);
export type Budget = z.infer<typeof budgetSchema>;

export const BUDGET_LABEL: Record<Budget, string> = {
  under_500: 'Under $500',
  '500_1000': '$500 - $1,000',
  '1000_2500': '$1,000 - $2,500',
  '2500_plus': '$2,500 and up',
  unsure: 'Not sure yet',
};

export const timeframeSchema = z.enum(['no_rush', 'few_months', 'specific_date']);
export type Timeframe = z.infer<typeof timeframeSchema>;

export const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  no_rush: 'No rush',
  few_months: 'Within a few months',
  specific_date: 'I have a date in mind',
};

/**
 * A snapshot of a painting as it was when the enquiry was sent.
 *
 * Copied rather than referenced on purpose: a piece can be retitled, repriced
 * or deleted between someone asking about it and the studio reading the
 * message, and an enquiry that says "about a painting that no longer exists"
 * is useless. The id is kept so the admin can still link through when the piece
 * is there.
 */
export const enquiryPaintingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});
export type EnquiryPainting = z.infer<typeof enquiryPaintingSchema>;

/** Caps that keep a single submission from being used as a storage bomb. */
const NAME_MAX = 120;
const EMAIL_MAX = 254;
const SHORT_MAX = 200;
const MESSAGE_MAX = 4000;

/** What the public form collects. Never trusted; parsed at the boundary. */
export const enquiryInputSchema = z.object({
  kind: enquiryKindSchema,
  name: z.string().trim().min(1, 'Tell the studio your name').max(NAME_MAX, 'That name is too long'),
  email: z
    .string()
    .trim()
    .min(1, 'An email address is needed to reply')
    .max(EMAIL_MAX, 'That address is too long')
    .pipe(z.email('That does not look like an email address')),
  message: z
    .string()
    .trim()
    .min(10, 'A sentence or two is plenty, but there needs to be something here')
    .max(MESSAGE_MAX, 'That message is too long - please trim it a little'),

  /** Commission only. Validated conditionally below. */
  subject: z.string().trim().max(SHORT_MAX, 'That is too long').default(''),
  size: z.string().trim().max(SHORT_MAX, 'That is too long').default(''),
  budget: budgetSchema.optional(),
  timeframe: timeframeSchema.optional(),

  /** Piece and purchase enquiries carry the canvases they are about. */
  paintings: z.array(enquiryPaintingSchema).max(50).default([]),
});
export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

/**
 * A commission with no brief is not a commission, so `subject` is required for
 * that kind and meaningless for the others. Expressed as a refinement rather
 * than three separate schemas, so the form has one parse to run and one place
 * that decides what a valid enquiry is.
 */
export const enquirySubmissionSchema = enquiryInputSchema.superRefine((value, ctx) => {
  if (value.kind === 'commission' && value.subject.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['subject'],
      message: 'Say what you would like painted',
    });
  }
});

export const enquirySchema = enquiryInputSchema.extend({
  id: z.string().min(1),
  /** Short, human-quotable handle, e.g. VR-4F2A - for use in reply subjects. */
  reference: z.string().min(1),
  status: enquiryStatusSchema,
  /** Studio-only, never shown to the sender. */
  notes: z.string().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Enquiry = z.infer<typeof enquirySchema>;

/** The inbox's unread count. */
export function countUnread(enquiries: Enquiry[]): number {
  return enquiries.filter((enquiry) => enquiry.status === 'new').length;
}

export interface EnquiryFilters {
  status: EnquiryStatus | null;
  kind: EnquiryKind | null;
}

export const NO_ENQUIRY_FILTERS: EnquiryFilters = { status: null, kind: null };

export function filterEnquiries(enquiries: Enquiry[], filters: EnquiryFilters): Enquiry[] {
  return enquiries.filter(
    (enquiry) =>
      (filters.status === null || enquiry.status === filters.status) &&
      (filters.kind === null || enquiry.kind === filters.kind),
  );
}

/** A one-line description of an enquiry, for the inbox row. */
export function enquirySummary(enquiry: Enquiry): string {
  if (enquiry.kind === 'commission') return enquiry.subject || 'Commission request';
  if (enquiry.paintings.length === 1) return enquiry.paintings[0].title;
  if (enquiry.paintings.length > 1) return `${enquiry.paintings.length} pieces`;
  return 'General enquiry';
}
