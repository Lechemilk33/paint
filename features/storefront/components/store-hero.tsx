import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { photoUrl, primaryPhoto, type Painting } from '@/lib/paintings/schema';
import { STUDIO } from '../studio';
import { AuroraField } from './aurora-field';
import { StatusBadge } from './status-badge';

/**
 * The opening statement. The featured canvas is the only saturated thing on the
 * screen at rest - the type is set on near-black so the paint carries the color,
 * which is how the work reads on a wall.
 *
 * Takes the featured piece as a prop: the route already loaded the catalog to
 * render the grid, so fetching again here would be a second read of the same
 * data. Renders nothing when the catalog is empty.
 */
export function StoreHero({ painting, totalCount, availableCount }: {
  painting: Painting;
  totalCount: number;
  availableCount: number;
}) {
  const photo = primaryPhoto(painting);

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
          {photo ? (
            <Image
              src={photoUrl(photo)}
              alt={photo.alt || painting.title}
              width={photo.width}
              height={photo.height}
              priority
              sizes="(min-width: 1024px) 42vw, 92vw"
              className="border-border ease-out-quart h-auto w-full -rotate-1 border shadow-lg transition-transform duration-500 group-hover:rotate-0"
            />
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge availability={painting.availability} />
            <p className="font-mono text-xs tracking-label uppercase">
              Featured · {painting.title}, {painting.year}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
