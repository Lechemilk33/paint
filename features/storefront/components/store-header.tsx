import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { studioName, type Studio } from '@/lib/studio/schema';

const NAV = [
  { href: '/store/gallery', label: 'Gallery' },
  { href: '/store/commission', label: 'Commission' },
];

/**
 * Store chrome. Sticky and translucent so the paintings keep scrolling under
 * it.
 *
 * There is no basket here, which is the point: every piece is one of one, so
 * there is nothing to collect and nothing to count. Buying happens on the
 * painting's own page, where the price and the shipping are, and the header
 * stays out of the way of the work.
 */
export function StoreHeader({ studio }: { studio: Studio }) {
  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-5 sm:gap-4 sm:px-8">
        <Link
          href="/store"
          className="focus-visible:ring-ring flex min-w-0 items-baseline gap-2 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          {/* Never allowed to wrap: a two-line wordmark blows out the fixed
              header height on a narrow screen. It gives way to the nav instead
              - the studio name is the studio's own and can be long, and a
              wordmark that pushes the links off the side of a phone is worse
              than one that ends in an ellipsis. */}
          <span className="font-poster truncate text-base leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-lg">
            {studioName(studio)}
          </span>
          <span
            aria-hidden="true"
            className="bg-magenta hidden size-1.5 shrink-0 rotate-45 sm:inline-block"
          />
        </Link>

        <nav aria-label="Storefront" className="flex shrink-0 items-center gap-1 sm:gap-4">
          {NAV.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className="hover:text-voltage rounded-none px-1.5 font-mono text-xs tracking-label uppercase sm:px-3"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
