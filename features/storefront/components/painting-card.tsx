import Image from 'next/image';
import Link from 'next/link';
import { formatDimensions, formatPrice } from '../format';
import type { Painting } from '../schema';
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
  return (
    <Link
      href={`/store/${painting.slug}`}
      className="group focus-visible:ring-ring block rounded-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <article>
        {/* A square frame with the canvas contained inside it, not cropped to
            fill it: the pieces are different shapes, and squaring them off would
            be editing the work, while letting each card size itself leaves the
            captions on ragged baselines. The dark mat around a narrower canvas
            reads as the wall it would hang on. */}
        <div className="border-border group-hover:border-magenta/70 bg-ink/50 relative aspect-square overflow-hidden border transition-colors duration-300">
          {/* The glow is a sibling, not a filter on the image, so the paint
              keeps its own color at every interaction state. */}
          <div className="from-magenta/0 via-magenta/0 to-voltage/0 group-hover:from-magenta/25 group-hover:to-voltage/25 pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100" />
          <Image
            src={painting.image.src}
            alt={painting.image.alt}
            width={painting.image.width}
            height={painting.image.height}
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="size-full object-contain transition-transform duration-500 ease-out-quart group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 z-20">
            <StatusBadge status={painting.status} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-4 pt-3">
          <h3 className="font-poster group-hover:text-voltage text-lg leading-tight font-extrabold tracking-tight transition-colors">
            {painting.title}
          </h3>
          <p className="text-foreground-secondary font-mono text-sm tabular-nums">
            {painting.status === 'sold' ? '—' : formatPrice(painting.priceCents)}
          </p>
        </div>
        <p className="text-muted-foreground mt-1 font-mono text-xs tracking-wide">
          {painting.year} · {formatDimensions(painting)}
        </p>
      </article>
    </Link>
  );
}
