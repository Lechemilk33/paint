import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { photoUrl, primaryPhoto, type Painting } from '@/lib/paintings/schema';
import { formatDimensions, formatPrice } from '../format';
import { StatusBadge } from './status-badge';

/**
 * One piece in the catalog grid. The whole card is a single link to the detail
 * page - the hold control lives there, so a grid of cards has exactly one target
 * per piece and nothing nested to trip over with a keyboard.
 *
 * The painting is never dimmed, blurred or desaturated, including when sold.
 * Chrome reacts to hover; the art does not.
 */
export function PaintingCard({
  painting,
  priority = false,
}: {
  painting: Painting;
  priority?: boolean;
}) {
  const photo = primaryPhoto(painting);

  return (
    <Link
      href={`/store/${painting.slug}`}
      className="group focus-visible:ring-ring focus-visible:ring-offset-background block rounded-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
    >
      <article>
        {/* A square frame with the canvas contained inside it, not cropped to
            fill it: the pieces are different shapes, and squaring them off would
            be editing the work, while letting each card size itself leaves the
            captions on ragged baselines. The dark mat around a narrower canvas
            reads as the wall it would hang on. */}
        <div className="border-border group-hover:border-vibrate-a bg-ink/50 relative aspect-square overflow-hidden border transition-colors duration-300">
          {/* Second edge in the complementary hue at the same value; only
              present on hover, so the grid at rest stays quiet. */}
          <div
            aria-hidden="true"
            className="border-vibrate-b/0 group-hover:border-vibrate-b/80 pointer-events-none absolute inset-[2px] z-20 border transition-colors duration-300"
          />
          {/* The glow is a sibling, not a filter on the image, so the paint
              keeps its own color at every interaction state. */}
          <div className="from-vibrate-a/0 to-vibrate-b/0 group-hover:from-vibrate-a/20 group-hover:to-vibrate-b/20 pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100" />
          {photo ? (
            <Image
              src={photoUrl(photo)}
              alt={photo.alt || painting.title}
              width={photo.width}
              height={photo.height}
              priority={priority}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
              className="ease-out-quart size-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-muted-foreground grid size-full place-items-center">
              <ImageOff className="size-8" />
            </span>
          )}
          <div className="absolute top-3 left-3 z-20">
            <StatusBadge availability={painting.availability} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-4 pt-3">
          <h3 className="font-poster group-hover:text-voltage text-lg leading-tight font-extrabold tracking-tight transition-colors">
            {painting.title}
          </h3>
          <p className="text-foreground-secondary font-mono text-sm tabular-nums">
            {painting.availability === 'available' || painting.availability === 'on_hold'
              ? formatPrice(painting.priceCents)
              : '—'}
          </p>
        </div>
        <p className="text-muted-foreground mt-1 font-mono text-xs tracking-wide">
          {painting.year} · {formatDimensions(painting)}
        </p>
      </article>
    </Link>
  );
}
