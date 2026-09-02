import Link from 'next/link';
import { Syne } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { PaintingCard } from '@/features/storefront/components/painting-card';
import { StoreFooter } from '@/features/storefront/components/store-footer';
import { StoreHeader } from '@/features/storefront/components/store-header';
import { listVisiblePaintings } from '@/lib/paintings/public';
import { getStudio } from '@/lib/studio/repository';

/**
 * Temporary. Delete once the storefront is green.
 *
 * Every /store route answers 500 on the host with one digest, and the same
 * commit serves all of them locally - under `next start` and under Netlify's
 * own build and runtime - so it cannot be reproduced here, and this session
 * has no way to read the host's function log. What is left is to ask the host
 * itself, one piece at a time: each probe renders one thing, dynamically, from
 * outside the store layout. A 500 on exactly one URL names what throws.
 *
 * `?p=none` is the control and matters as much as the rest. Nothing dynamic
 * that renders HTML is reachable on this site without a password - the login
 * page is prerendered and the photo route returns bytes - so if even the
 * control fails, the fault is above the storefront and the search moves to the
 * root layout.
 */
export const dynamic = 'force-dynamic';

const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '800'],
  variable: '--font-syne',
});

export default async function DiagPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p = 'none' } = await searchParams;

  if (p === 'none') return <p>control ok</p>;
  if (p === 'font') return <div className={syne.variable}>font ok</div>;

  if (p === 'button') {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href="/store">button ok</Link>
      </Button>
    );
  }

  if (p === 'studio') {
    const studio = await getStudio();
    return <p>studio ok: {studio.name || '(empty)'}</p>;
  }

  if (p === 'catalog') {
    const paintings = await listVisiblePaintings();
    return <p>catalog ok: {paintings.length} pieces</p>;
  }

  if (p === 'card') {
    const paintings = await listVisiblePaintings();
    const painting = paintings[0];
    if (!painting) return <p>card skipped: no pieces</p>;
    return <PaintingCard painting={painting} />;
  }

  if (p === 'header') return <StoreHeader studio={await getStudio()} />;
  if (p === 'footer') return <StoreFooter studio={await getStudio()} />;

  if (p === 'layout') {
    const studio = await getStudio();
    return (
      <div className={`${syne.variable} storefront dark bg-background text-foreground min-h-svh`}>
        <StoreHeader studio={studio} />
        <main>
          <p>layout ok</p>
        </main>
        <StoreFooter studio={studio} />
      </div>
    );
  }

  return <p>unknown probe</p>;
}
