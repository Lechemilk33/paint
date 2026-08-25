import type { EnquiryKind } from '@/lib/enquiries/schema';

/**
 * What a submission round-trip hands back to the form.
 *
 * `values` is the whole point: a server action re-renders the form from
 * scratch, so without echoing the submitted text back, one failed validation
 * throws away everything the visitor typed. That is the single most
 * infuriating thing a contact form can do, and it is what `defaultValue` alone
 * gets you.
 *
 * Lives outside the actions module because a `'use server'` file may only
 * export async functions.
 */
export interface EnquiryFormState {
  status: 'idle' | 'error' | 'sent';
  /** Message shown above the form when the whole submission failed. */
  error: string | null;
  fieldErrors: Record<string, string>;
  /** Echoed back so nothing typed is lost on a failed submit. */
  values: Record<string, string>;
  /** Set once accepted, so the success panel can quote it back. */
  reference: string | null;
}

export const EMPTY_ENQUIRY_STATE: EnquiryFormState = {
  status: 'idle',
  error: null,
  fieldErrors: {},
  values: {},
  reference: null,
};

/** Copy shown after a successful send, which differs by what was asked. */
export const SENT_COPY: Record<EnquiryKind, { title: string; body: string }> = {
  commission: {
    title: 'Commission request sent',
    body: 'The studio will come back to you with questions, a price and a rough timeline. Commissions are usually answered within a week.',
  },
  piece: {
    title: 'Question sent',
    body: 'The studio will reply to you directly about this piece, usually within a week.',
  },
  purchase: {
    title: 'Enquiry sent',
    body: 'The studio will confirm what is still available and reply with payment and shipping, usually within a week.',
  },
};
