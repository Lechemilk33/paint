/**
 * Shapes shared between the admin forms and the server actions they post to.
 *
 * These live outside painting-actions.ts because a `'use server'` module may
 * only export async functions - a plain object exported from one is rewritten
 * into a server reference, and the form receives that instead of its initial
 * state.
 */

/**
 * What a form round-trip reports back: which fields failed, why, and what was
 * typed.
 *
 * `values` exists because React resets a form once its action resolves, which
 * restores every uncontrolled input to the `defaultValue` it was rendered
 * with. Without the submitted values coming back to seed those defaults, a
 * single missing field would wipe a page of typing - the story, the notes, the
 * lot. Echoing them back is what makes a rejected submission a correction
 * rather than a re-entry.
 */
export interface FormState {
  error: string | null;
  fieldErrors: Record<string, string>;
  /** Exactly what was posted, keyed by form field name. */
  values: Record<string, string>;
}

export const EMPTY_FORM_STATE: FormState = { error: null, fieldErrors: {}, values: {} };

/**
 * Everything the person typed, ready to be rendered straight back into the
 * form. Files are skipped - a photo input cannot be refilled from the server -
 * and so is any record id, which a form carries in its own hidden field.
 */
export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of formData.entries()) {
    if (typeof value === 'string' && name !== 'id') values[name] = value;
  }
  return values;
}

export interface UploadState {
  error: string | null;
  uploaded: number;
}

export const EMPTY_UPLOAD_STATE: UploadState = { error: null, uploaded: 0 };
