import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AVAILABILITY_LABEL,
  EDITION_LABEL,
  type Painting,
} from '@/lib/paintings/schema';
import type { Studio } from '@/lib/studio/schema';
import { formatDimensions, formatPrice } from '../format';
import { PaintingGallery } from './painting-gallery';
import { PaintingPurchase } from './painting-purchase';
import { RelatedPaintings } from './related-paintings';
import { StatusBadge } from './status-badge';

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex items-baseline justify-between gap-6 border-b py-3 last:border-b-0">
      <dt className="text-muted-foreground tracking-label font-mono text-xs uppercase">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

export function PaintingDetail({
  painting,
  paintings,
  studio,
  ask,
}: {
  painting: Painting;
  paintings: Painting[];
  studio: Studio;
  /** Raw `?ask=` value. Validated where it is used, never trusted here. */
  ask?: string;
}) {
  // A piece can override the studio's usual terms; most will not.
  const shipping = painting.framingShipping || studio.shipping;
  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hover:text-voltage tracking-label -ml-3 rounded-none font-mono text-xs uppercase"
      >
        <Link href="/store">
          <ArrowLeft aria-hidden="true" />
          All work
        </Link>
      </Button>

      {/* grid-cols-[1.15fr_1fr]: the painting leads on the detail page, so it
          takes the wider column and the spec panel reads beside it. */}
      <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24">
          <PaintingGallery painting={painting} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge availability={painting.availability} />
            {painting.series ? (
              <span className="text-muted-foreground tracking-label font-mono text-xs uppercase">
                {painting.series}
              </span>
            ) : null}
          </div>

          {/* leading-[0.95]: same sub-1 display leading as the hero, one step
              looser because the title sits in a narrower column. */}
          <h1 className="font-poster text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl">
            {painting.title}
          </h1>

          {painting.blurb ? (
            <p className="text-foreground-secondary text-base leading-relaxed sm:text-lg">
              {painting.blurb}
            </p>
          ) : null}

          <p className="font-poster text-3xl font-extrabold tabular-nums">
            {painting.availability === 'available' || painting.availability === 'on_hold'
              ? formatPrice(painting.priceCents)
              : AVAILABILITY_LABEL[painting.availability]}
          </p>

          <PaintingPurchase painting={painting} ask={ask} />

          <dl className="mt-2">
            <SpecRow label="Year" value={String(painting.year)} />
            <SpecRow label="Medium" value={painting.medium} />
            <SpecRow label="Canvas" value={formatDimensions(painting)} />
            <SpecRow label="Edition" value={EDITION_LABEL[painting.edition]} />
            {shipping ? <SpecRow label="Ships" value={shipping} /> : null}
          </dl>

          {painting.story ? (
            <div className="flex flex-col gap-3">
              <h2 className="tracking-label font-mono text-xs uppercase">About this painting</h2>
              <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-line">
                {painting.story}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <RelatedPaintings painting={painting} paintings={paintings} />
    </>
  );
}
