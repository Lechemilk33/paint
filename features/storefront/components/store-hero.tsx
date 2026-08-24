import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCatalogSummary, fetchFeaturedPainting, STUDIO } from '../catalog';
import { AuroraField } from './aurora-field';
import { StatusBadge } from './status-badge';

/**
 * The opening statement. The featured canvas is the only saturated thing on the
 * screen at rest - the type is set on near-black so the paint carries the color,
 * which is how the work reads on a wall.
 *
 * Fetches its own data so the route stays pure composition.
 */
export async function StoreHero() {
  const [painting, { total: totalCount, available: availableCount }] = await Promise.all([
    fetchFeaturedPainting(),
    fetchCatalogSummary(),
  ]);

  return (
    <section className="relative isolate overflow-hidden">
      <AuroraField />
      {/* grid-cols-[1.05fr_1fr]: the copy column gets a shade more room than
          the canvas, so the headline breaks where it is written to break. */}
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <div className="flex flex-col items-start gap-7">
          <p className="border-voltage/40 text-voltage border px-3 py-1 font-mono text-xs tracking-banner uppercase">
            Originals · {availableCount} available of {totalCount}
          </p>

          {/* leading-[0.92]: display type at this size needs sub-1 leading to
              stack as a block. Tailwind's tightest step, leading-none, is 1. */}
          <h1 className="font-poster text-3xl leading-[0.92] font-extrabold tracking-tight text-balance xs:text-4xl sm:text-6xl lg:text-7xl">
            Psychedelic
            <span className="text-magenta"> realism</span>,
            <br />
            painted small and loud.
          </h1>

          <p className="text-foreground-secondary max-w-lg text-base leading-relaxed sm:text-lg">
            Real animals and invented ones, drawn with real anatomy and coloured like a power surge.
            Acrylic and ink on stretched canvas, one of each, straight from the studio table.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-none font-mono text-xs tracking-label uppercase"
            >
              <Link href="#catalog">
                See the work
                <ArrowDown aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage rounded-none font-mono text-xs tracking-label uppercase"
            >
              <a href={`mailto:${STUDIO.contactEmail}`}>Commission a piece</a>
            </Button>
          </div>
        </div>

        {/* The featured canvas, tilted a couple of degrees so it reads as an
            object on a table rather than a product shot. */}
        <Link
          href={`/store/${painting.slug}`}
          className="group focus-visible:ring-ring relative block focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <div
            aria-hidden="true"
            className="bg-magenta/40 absolute -inset-6 -z-10 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
          />
          <Image
            src={painting.image.src}
            alt={painting.image.alt}
            width={painting.image.width}
            height={painting.image.height}
            priority
            sizes="(min-width: 1024px) 42vw, 92vw"
            className="border-border h-auto w-full -rotate-1 border shadow-lg transition-transform duration-500 ease-out-quart group-hover:rotate-0"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={painting.status} />
            <p className="font-mono text-xs tracking-label uppercase">
              Featured · {painting.title}, {painting.year}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
