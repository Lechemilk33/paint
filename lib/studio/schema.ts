import { z } from 'zod';

/**
 * Everything the storefront says about the studio in its own voice.
 *
 * This exists because the alternative is worse: prose written into components
 * by whoever built the site, describing a practice they do not have. Process
 * claims, shipping terms and turnaround promises are statements of fact about
 * someone's business, and there is no honest default for them - so they live
 * here, start empty, and every surface that renders them omits the section
 * entirely when they are blank.
 *
 * Nothing in this file has a placeholder value. Blank means blank.
 */
export const studioSchema = z.object({
  /** The wordmark. The one field with a fallback, since the header needs it. */
  name: z.string().trim().max(60).default(''),
  /** One line under the wordmark in the footer. */
  tagline: z.string().trim().max(160).default(''),
  /** The About section on the store home. Rendered only when written. */
  about: z.string().trim().max(2000).default(''),
  /** Where inquiries are answered from. Shown only when set. */
  contactEmail: z.string().trim().max(254).default(''),
  /** Framing, packing and shipping, in the studio's own words. */
  shipping: z.string().trim().max(1000).default(''),
  /** How long a reply usually takes. Blank means no promise is made. */
  responseTime: z.string().trim().max(120).default(''),
  /** Short phrases for the marquee. Empty means the marquee is not rendered. */
  marquee: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});
export type Studio = z.infer<typeof studioSchema>;

/**
 * The starting state: a name so the header is not blank, and nothing else.
 * Every other surface stays hidden until the studio fills it in.
 */
export const EMPTY_STUDIO: Studio = {
  name: 'Voltage Reef',
  tagline: '',
  about: '',
  contactEmail: '',
  shipping: '',
  responseTime: '',
  marquee: [],
};

/** The wordmark, with a fallback so the header always has something to show. */
export function studioName(studio: Studio): string {
  return studio.name || 'The Studio';
}
