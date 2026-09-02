/**
 * Shapes shared between the admin forms and the server actions they post to.
 *
 * These live outside painting-actions.ts because a `'use server'` module may
 * only export async functions - a plain object exported from one is rewritten
 * into a server reference, and the form receives that instead of its initial
 * state.
 */

/** What a form round-trip reports back: which fields failed, and why. */
export interface FormState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

export const EMPTY_FORM_STATE: FormState = { error: null, fieldErrors: {} };

export interface UploadState {
  error: string | null;
  uploaded: number;
}

export const EMPTY_UPLOAD_STATE: UploadState = { error: null, uploaded: 0 };
