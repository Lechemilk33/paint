import 'server-only';
import Stripe from 'stripe';

/**
 * The Stripe client, and the question of whether Stripe is set up at all.
 *
 * Payment is optional infrastructure here. The studio ran on email inquiries
 * before it took cards and still does for anything not switched on for instant
 * checkout, so a site with no Stripe keys is a supported configuration rather
 * than a broken one: `stripeConfigured()` is false, the Buy button never
 * renders, and every piece falls back to the inquiry form. That is also what
 * keeps `next build` working in CI and on a fresh clone with no secrets.
 */
let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  // Memoised so a request that creates a session and then reads it back does
  // not build two clients, each with its own connection pool.
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Pinned rather than floating: an account-level API version change should
    // not alter what this code receives without a deploy.
    apiVersion: '2026-07-29.dahlia',
    appInfo: { name: 'Voltage Reef storefront' },
  });
  return client;
}

/**
 * The site's own origin, for building the URLs Stripe redirects back to.
 *
 * Netlify injects `URL` for the production site and `DEPLOY_PRIME_URL` for
 * previews. Preferring the deploy URL means a preview's checkout returns to
 * that preview instead of to production - which matters because the two do not
 * share a catalog, so a cross-deploy return would land on a missing painting.
 */
export function siteOrigin(): string {
  const configured =
    process.env.SITE_ORIGIN || process.env.DEPLOY_PRIME_URL || process.env.URL;
  return (configured || 'http://localhost:3000').replace(/\/+$/, '');
}
