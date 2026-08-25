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
 * Tried in order of how much they can be trusted. `SITE_ORIGIN` is explicit.
 * Netlify's `DEPLOY_PRIME_URL` and `URL` come next, deploy URL first so a
 * preview's checkout returns to that preview rather than to production - the
 * two do not share a catalog, and a cross-deploy return would land on a
 * painting that is not there.
 *
 * The request's own headers are the last resort, and they are here because
 * both Netlify variables are documented as *build* variables: if neither
 * reaches the function runtime, every buyer would be sent to localhost after
 * paying, and it would only show up once real money had moved. Reading the
 * host off the request cannot be absent at request time. It is last because
 * a forged Host header would steer the redirect - though only for the person
 * who forged it, since it decides where that one buyer lands afterwards.
 */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.SITE_ORIGIN || process.env.DEPLOY_PRIME_URL || process.env.URL;
  if (configured) return configured.replace(/\/+$/, '');

  const { headers } = await import('next/headers');
  const headerList = await headers();
  const host = headerList.get('host');
  if (host) {
    // Behind Netlify's proxy the scheme is only in the forwarded header; a
    // bare `host` on a real deploy is https either way.
    const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}
