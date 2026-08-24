'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STUDIO } from '../catalog';
import { formatDimensions, formatPrice } from '../format';
import { paintingDetailOptions, seriesListOptions } from '../queries';
import type { Painting } from '../schema';
import { useCart } from './cart-provider';
import { HoldButton } from './hold-button';
import { RelatedPaintings } from './related-paintings';
import { StatusBadge } from './status-badge';

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex items-baseline justify-between gap-6 border-b py-3 last:border-b-0">
      <dt className="text-muted-foreground font-mono text-xs tracking-label uppercase">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

/** The buy control, and what replaces it once a piece is gone or spoken for.
 *  Wrapped in a row so the buttons size to their content: as a direct child of
 *  the detail column's flex stack they would be stretched to its full width. */
function Availability({ painting }: { painting: Painting }) {
  const { isHeld, setOpen } = useCart();

  if (painting.status === 'available') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <HoldButton painting={painting} size="lg" className="w-full sm:w-auto" />
        {isHeld(painting.id) ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setOpen(true)}
            className="hover:text-voltage rounded-none font-mono text-xs tracking-label uppercase"
          >
            View holds
          </Button>
        ) : null}
      </div>
    );
  }

  const message =
    painting.status === 'sold'
      ? 'This one has found a wall. Commissions in the same vein are open.'
      : 'Someone has a hold on this piece. Ask to be next in line if it comes back.';

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-foreground-secondary text-sm">{message}</p>
      <Button
        asChild
        size="lg"
        variant="outline"
        className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage rounded-none font-mono text-xs tracking-label uppercase"
      >
        <a href={`mailto:${STUDIO.contactEmail}?subject=${encodeURIComponent(painting.title)}`}>
          Ask about this piece
        </a>
      </Button>
    </div>
  );
}

export function PaintingDetail({ slug }: { slug: string }) {
  const { data: painting } = useSuspenseQuery(paintingDetailOptions(slug));
  const { data: series } = useSuspenseQuery(seriesListOptions());

  if (!painting) {
    return (
      <div className="flex flex-col items-start gap-4 py-24">
        <h1 className="font-poster text-3xl font-extrabold">That piece is not here</h1>
        <p className="text-muted-foreground">It may have been retitled or taken down.</p>
        <Button asChild className="rounded-none font-mono text-xs tracking-label uppercase">
          <Link href="/store">Back to the work</Link>
        </Button>
      </div>
    );
  }

  const seriesName = series.find((entry) => entry.id === painting.seriesId)?.name ?? null;

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hover:text-voltage -ml-3 rounded-none font-mono text-xs tracking-label uppercase"
      >
        <Link href="/store">
          <ArrowLeft aria-hidden="true" />
          All work
        </Link>
      </Button>

      {/* grid-cols-[1.15fr_1fr]: the painting leads on the detail page, so it
          takes the wider column and the spec panel reads beside it. */}
      <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="relative lg:sticky lg:top-24">
          <div aria-hidden="true" className="bg-magenta/25 absolute -inset-4 -z-10 blur-3xl" />
          <Image
            src={painting.image.src}
            alt={painting.image.alt}
            width={painting.image.width}
            height={painting.image.height}
            priority
            sizes="(min-width: 1024px) 55vw, 92vw"
            className="border-border h-auto w-full border shadow-lg"
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={painting.status} />
            {seriesName ? (
              <span className="text-muted-foreground font-mono text-xs tracking-label uppercase">
                {seriesName}
              </span>
            ) : null}
          </div>

          {/* leading-[0.95]: same sub-1 display leading as the hero, one step
              looser because the title sits in a narrower column. */}
          <h1 className="font-poster text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl">
            {painting.title}
          </h1>

          <p className="text-foreground-secondary text-base leading-relaxed sm:text-lg">
            {painting.blurb}
          </p>

          <p className="font-poster text-3xl font-extrabold tabular-nums">
            {painting.status === 'sold' ? 'Sold' : formatPrice(painting.priceCents)}
          </p>

          <Availability painting={painting} />

          <dl className="mt-2">
            <SpecRow label="Year" value={String(painting.year)} />
            <SpecRow label="Medium" value={painting.medium} />
            <SpecRow label="Canvas" value={formatDimensions(painting)} />
            <SpecRow label="Edition" value="Original, one of one" />
            <SpecRow label="Ships" value="Flat and unframed, tracked" />
          </dl>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-label uppercase">About this painting</h2>
            <p className="text-foreground-secondary text-sm leading-relaxed">{painting.story}</p>
          </div>
        </div>
      </div>

      <RelatedPaintings painting={painting} />
    </>
  );
}
