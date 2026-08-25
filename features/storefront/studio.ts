/**
 * Store identity. Single source for the wordmark and the contact handoff, so
 * renaming the shop is a one-line change.
 *
 * PLACEHOLDER: `contactEmail` deliberately uses the reserved `.example` domain
 * so nothing can be sent to a real inbox by accident. Swap it for the studio's
 * real address before this goes live.
 */
export const STUDIO = {
  name: 'Voltage Reef',
  tagline: 'Psychedelic realism, painted on small canvas',
  contactEmail: 'hello@voltagereef.example',
} as const;
