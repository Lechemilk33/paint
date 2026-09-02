import Link from 'next/link';
import { Syne } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { StoreFooter } from '@/features/storefront/components/store-footer';
import { StoreHeader } from '@/features/storefront/components/store-header';
import { getStudio } from '@/lib/studio/repository';

/**
 * Temporary. Delete once the storefront is green.
 *
 * Every /store route started answering 500 on the host while the same build
 * served every one of them locally, and the host gives this session no way to
 * read a function log - so the error has to be narrowed from the outside. Each
 * probe renders one piece of the store layout on its own, dynamically, so a 500
 * on exactly one URL names the piece that is throwing instead of leaving it to
 * be guessed at.
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
  const { p } = await searchParams;

  if (p === 'font') return <div className={syne.variable}>font ok</div>;

  // The one that matters: a Radix Slot rendered from a server component, which
  // is what dropping 'use client' from the header moved into the layout.
  if (p === 'button') {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href="/store">button ok</Link>
      </Button>
    );
  }

  const studio = await getStudio();
  if (p === 'header') return <StoreHeader studio={studio} />;
  if (p === 'footer') return <StoreFooter studio={studio} />;
  return <p>studio ok: {studio.name || '(empty)'}</p>;
}
