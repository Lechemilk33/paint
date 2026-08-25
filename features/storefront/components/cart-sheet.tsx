'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail, ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { photoUrl, primaryPhoto, type Painting } from '@/lib/paintings/schema';
import { buildInquiryMailto, formatDimensions, formatPrice } from '../format';
import { STUDIO } from '../studio';
import { useCart } from './cart-provider';
import { SpikeRule } from './spike-rule';

/**
 * The held pieces. The catalog comes from the cart context, which the store
 * layout fills on the server, so there is nothing to load here and no failure
 * state to render - the ids are resolved against data the page already has.
 */
/** The held piece's primary photo, or a neutral block when it has none. */
function PaintingThumb({ painting }: { painting: Painting }) {
  const photo = primaryPhoto(painting);
  if (!photo) return <div className="bg-muted size-20 shrink-0" />;
  return (
    <Image
      src={photoUrl(photo)}
      alt=""
      width={photo.width}
      height={photo.height}
      sizes="80px"
      className="size-20 shrink-0 object-cover"
    />
  );
}

function CartContents() {
  const { held, paintings, release, clear } = useCart();

  // Ids that no longer resolve (catalog edited since the hold was stored) are
  // dropped rather than rendered as a blank row.
  const heldPaintings = held
    .map((id) => paintings.find((painting) => painting.id === id))
    .filter((painting) => painting !== undefined);

  if (heldPaintings.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 px-4">
        <ShoppingBag aria-hidden="true" className="text-voltage size-6" />
        <p className="font-poster text-lg font-extrabold">Nothing held yet</p>
        <p className="text-muted-foreground text-sm">
          Put a piece on hold and it collects here, ready to send over as one enquiry.
        </p>
      </div>
    );
  }

  const total = heldPaintings.reduce((sum, painting) => sum + painting.priceCents, 0);

  return (
    <>
      <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        {heldPaintings.map((painting) => (
          <li key={painting.id} className="border-border flex gap-3 border-b pb-4 last:border-b-0">
            <PaintingThumb painting={painting} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={`/store/${painting.slug}`}
                className="font-poster hover:text-voltage focus-visible:ring-ring truncate text-base font-extrabold focus-visible:ring-2 focus-visible:outline-none"
              >
                {painting.title}
              </Link>
              <p className="text-muted-foreground font-mono text-xs">
                {painting.year} · {formatDimensions(painting)}
              </p>
              <p className="font-mono text-sm tabular-nums">{formatPrice(painting.priceCents)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => release(painting.id)}
              aria-label={`Release ${painting.title}`}
              className="hover:text-magenta shrink-0 rounded-none"
            >
              <X aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <SheetFooter className="gap-3">
        <SpikeRule />
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-xs tracking-label uppercase">Total</span>
          <span className="font-poster text-xl font-extrabold tabular-nums">
            {formatPrice(total)}
          </span>
        </div>
        <Button asChild className="w-full rounded-none font-mono text-xs tracking-label uppercase">
          <a href={buildInquiryMailto(STUDIO.contactEmail, STUDIO.name, heldPaintings)}>
            <Mail aria-hidden="true" />
            Send enquiry
          </a>
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Opens an email to the studio with these pieces listed. Payment and shipping are arranged
          by reply.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="rounded-none font-mono text-xs tracking-label uppercase"
        >
          Release all
        </Button>
      </SheetFooter>
    </>
  );
}

export function CartSheet() {
  const { isOpen, setOpen, held } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      {/* Radix portals to <body>, outside the storefront token subtree, so the
          scope class is re-applied here or the panel would inherit CRM colors.
          `text-foreground` has to be set alongside it: `color` inherits as a
          computed value, so without it every unstyled string in here keeps the
          near-black the CRM's <body> resolved - dark text on the dark panel. */}
      <SheetContent className="storefront dark border-border text-foreground w-full gap-6 sm:max-w-md">
        <SheetHeader className="gap-1.5 pb-0">
          <SheetTitle className="font-poster text-2xl font-extrabold tracking-tight">
            On hold
          </SheetTitle>
          <SheetDescription>
            {held.length === 1 ? '1 piece' : `${held.length} pieces`} reserved in this browser.
          </SheetDescription>
        </SheetHeader>
        <CartContents />
      </SheetContent>
    </Sheet>
  );
}
