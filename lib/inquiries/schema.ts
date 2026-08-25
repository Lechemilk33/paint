import { z } from 'zod';

/**
 * Why someone got in touch. The three routes into the studio's inbox are
 * genuinely different conversations - a commission is a brief, a question is
 * about one canvas, a purchase inquiry is a list of pieces someone wants to
 * buy - so they are one record with a discriminating kind rather than three
 * tables, which keeps the inbox a single ordered stream.
 */
export const inquiryKindSchema = z.enum(['commission', 'piece', 'purchase']);
export type InquiryKind = z.infer<typeof inquiryKindSchema>;

export const INQUIRY_KIND_LABEL: Record<InquiryKind, string> = {
  commission: 'Commission',
  piece: 'Question',
  purchase: 'Purchase',
};

/**
 * Where a conversation has got to. `new` is the unread state and drives the
 * badge; opening an inquiry moves it to `open`, so the badge counts things
 * genuinely unseen rather than things merely unfinished.
 */
export const inquiryStatusSchema = z.enum(['new', 'open', 'replied', 'archived']);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
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
 * A snapshot of a painting as it was when the inquiry was sent.
 *
 * Copied rather than referenced on purpose: a piece can be retitled, repriced
 * or deleted between someone asking about it and the studio reading the
 * message, and an inquiry that says "about a painting that no longer exists"
 * is useless. The id is kept so the admin can still link through when the piece
 * is there.
 */
export const inquiryPaintingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});
export type InquiryPainting = z.infer<typeof inquiryPaintingSchema>;

/** Caps that keep a single submission from being used as a storage bomb. */
const NAME_MAX = 120;
const EMAIL_MAX = 254;
const SHORT_MAX = 200;
const MESSAGE_MAX = 4000;

/** What the public form collects. Never trusted; parsed at the boundary. */
export const inquiryInputSchema = z.object({
  kind: inquiryKindSchema,
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

  /** Piece and purchase inquiries carry the canvases they are about. */
  paintings: z.array(inquiryPaintingSchema).max(50).default([]),
});
export type InquiryInput = z.infer<typeof inquiryInputSchema>;

/**
 * A commission with no brief is not a commission, so `subject` is required for
 * that kind and meaningless for the others. Expressed as a refinement rather
 * than three separate schemas, so the form has one parse to run and one place
 * that decides what a valid inquiry is.
 */
export const inquirySubmissionSchema = inquiryInputSchema.superRefine((value, ctx) => {
  if (value.kind === 'commission' && value.subject.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['subject'],
      message: 'Say what you would like painted',
    });
  }
});

export const inquirySchema = inquiryInputSchema.extend({
  id: z.string().min(1),
  /** Short, human-quotable handle, e.g. VR-4F2A - for use in reply subjects. */
  reference: z.string().min(1),
  status: inquiryStatusSchema,
  /** Studio-only, never shown to the sender. */
  notes: z.string().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Inquiry = z.infer<typeof inquirySchema>;

/** The inbox's unread count. */
export function countUnread(inquiries: Inquiry[]): number {
  return inquiries.filter((inquiry) => inquiry.status === 'new').length;
}

export interface InquiryFilters {
  status: InquiryStatus | null;
  kind: InquiryKind | null;
}

export const NO_INQUIRY_FILTERS: InquiryFilters = { status: null, kind: null };

export function filterInquiries(inquiries: Inquiry[], filters: InquiryFilters): Inquiry[] {
  return inquiries.filter(
    (inquiry) =>
      (filters.status === null || inquiry.status === filters.status) &&
      (filters.kind === null || inquiry.kind === filters.kind),
  );
}

/** A one-line description of an inquiry, for the inbox row. */
export function inquirySummary(inquiry: Inquiry): string {
  if (inquiry.kind === 'commission') return inquiry.subject || 'Commission request';
  if (inquiry.paintings.length === 1) return inquiry.paintings[0].title;
  if (inquiry.paintings.length > 1) return `${inquiry.paintings.length} pieces`;
  return 'General inquiry';
}
