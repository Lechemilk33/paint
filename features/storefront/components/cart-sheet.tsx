'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
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
import { EnquiryForm } from '@/features/enquiries/components/enquiry-form';
import { formatDimensions, formatPrice } from '../format';
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

function CartContents({
  hasSent,
  onSent,
}: {
  hasSent: boolean;
  onSent: () => void;
}) {
  const { held, paintings, release, clear } = useCart();

  // Ids that no longer resolve (catalog edited since the hold was stored) are
  // dropped rather than rendered as a blank row.
  const heldPaintings = held
    .map((id) => paintings.find((painting) => painting.id === id))
    .filter((painting) => painting !== undefined);

  if (!hasSent && heldPaintings.length === 0) {
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
      {/* Once sent, the basket chrome goes: a list and a total read as
          something still waiting to be sent. The form itself stays mounted
          throughout, because its confirmation lives in its own state -
          unmounting it to show a "sent" panel would reset it to a blank form.
          The holds are kept until the sheet closes rather than cleared here,
          which would otherwise empty the panel and replace the confirmation
          with "nothing held yet". */}
      {hasSent ? null : (
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
      )}

      <SheetFooter className="gap-4">
        {hasSent ? null : (
          <>
            <SpikeRule />
            <div className="flex items-baseline justify-between">
              <span className="tracking-label font-mono text-xs uppercase">Total</span>
              <span className="font-poster text-xl font-extrabold tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </>
        )}

        {/* The enquiry is the checkout. Nothing here takes payment, so the
            handoff is a message naming the pieces - sent through the studio's
            own inbox rather than thrown at a mail client, which means it is
            recorded whether or not the visitor has mail set up on this device. */}
        <EnquiryForm
          kind="purchase"
          paintings={heldPaintings.map((painting) => ({
            id: painting.id,
            title: painting.title,
            slug: painting.slug,
            priceCents: painting.priceCents,
          }))}
          submitLabel="Send enquiry"
          onSent={onSent}
          className="gap-4"
        />

        {hasSent ? null : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="tracking-label rounded-none font-mono text-xs uppercase"
          >
            Release all
          </Button>
        )}
      </SheetFooter>
    </>
  );
}

export function CartSheet() {
  const { isOpen, setOpen, held, clear } = useCart();
  const [hasSent, setHasSent] = useState(false);

  /** Closing after a send is what finally releases the pieces - and resets the
   *  panel, so the next visit to the cart is not a stale confirmation. */
  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (!open && hasSent) {
      clear();
      setHasSent(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
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
            {hasSent
              ? 'Sent to the studio.'
              : `${held.length === 1 ? '1 piece' : `${held.length} pieces`} reserved in this browser.`}
          </SheetDescription>
        </SheetHeader>
        <CartContents hasSent={hasSent} onSent={() => setHasSent(true)} />
      </SheetContent>
    </Sheet>
  );
}
