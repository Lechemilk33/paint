import Link from 'next/link';

export const metadata = {
  title: 'Voltage Reef',
};

/**
 * The site entry point. The storefront itself lives under /store, so this page
 * only bounces to it. A static export has no server to issue a 30x, so the
 * redirect is a meta refresh (React hoists the tag into <head>) - which works
 * on every static host with no per-host config. Netlify additionally gets a
 * real 302 from netlify.toml, so this page is only ever seen if that misses.
 */
export default function RootPage() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/store/" />
      <main className="storefront dark bg-background text-foreground grid min-h-svh place-items-center p-6">
        <Link href="/store/" className="text-primary text-sm underline underline-offset-4">
          Continue to the store
        </Link>
      </main>
    </>
  );
}
