'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { studioName, type Studio } from '@/lib/studio/schema';
import { useCart } from './cart-provider';
import { CartSheet } from './cart-sheet';

const NAV = [
  { href: '/store/gallery', label: 'Gallery' },
  { href: '/store/commission', label: 'Commission' },
];

/**
 * Store chrome. Sticky and translucent so the paintings keep scrolling under it,
 * and it owns the single mounted CartSheet for the whole storefront.
 */
export function StoreHeader({ studio }: { studio: Studio }) {
  const { held, setOpen } = useCart();

  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/store"
          className="focus-visible:ring-ring flex items-baseline gap-2 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          {/* Never allowed to wrap: a two-line wordmark blows out the fixed
              header height on a narrow screen. */}
          <span className="font-poster text-base leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-lg">
            {studioName(studio)}
          </span>
          <span
            aria-hidden="true"
            className="bg-magenta hidden size-1.5 shrink-0 rotate-45 sm:inline-block"
          />
        </Link>

        <nav aria-label="Storefront" className="flex items-center gap-1 sm:gap-4">
          {NAV.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              // Section anchors on a one-page shop: dropped below sm, where the
              // wordmark and the holds button need the whole bar.
              className="hover:text-voltage hidden rounded-none font-mono text-xs tracking-label uppercase sm:inline-flex"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage rounded-none font-mono text-xs tracking-label uppercase"
          >
            <ShoppingBag aria-hidden="true" />
            <span className="hidden sm:inline">Holds</span>
            <span aria-hidden="true" className="tabular-nums">
              {held.length}
            </span>
            <span className="sr-only">
              {held.length === 1 ? '1 piece on hold' : `${held.length} pieces on hold`}
            </span>
          </Button>
        </nav>
      </div>

      <CartSheet />
    </header>
  );
}
