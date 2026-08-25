import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Painting } from '@/lib/paintings/schema';
import type { Studio } from '@/lib/studio/schema';
import { AuroraField } from './aurora-field';
import { HeroCarousel } from './hero-carousel';

/**
 * The opening statement.
 *
 * The headline names the genre and nothing else. What used to sit under it was
 * a paragraph about anatomy, acrylic and the studio table, written by whoever
 * built the site rather than by the person who made the work - so it is gone,
 * and the studio's own line takes its place when there is one.
 *
 * The canvases are the only saturated thing on screen at rest. That is the
 * whole idea: psychedelic realism puts impossible color on a truthfully drawn
 * subject, so the page stays near-black and lets the paint do the shouting.
 */
export function StoreHero({
  paintings,
  studio,
  availableCount,
}: {
  paintings: Painting[];
  studio: Studio;
  availableCount: number;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <AuroraField />
      {/* grid-cols-[1.05fr_1fr]: the copy column gets a shade more room than
          the canvas, so the headline breaks where it is written to break. */}
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <div className="flex flex-col items-start gap-7">
          <p className="border-voltage/40 text-voltage tracking-banner border px-3 py-1 font-mono text-xs uppercase">
            {paintings.length} {paintings.length === 1 ? 'piece' : 'pieces'}
            {availableCount > 0 ? ` · ${availableCount} available` : ''}
          </p>

          {/* leading-[0.92]: display type at this size needs sub-1 leading to
              stack as a block; Tailwind's tightest step, leading-none, is 1.
              The two words are set in near-complementary hues at close value -
              the optical-vibration trick the 1960s poster artists used, where
              the boundary between them buzzes instead of sitting flat. */}
          <h1 className="font-poster xs:text-5xl text-4xl leading-[0.92] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            <span className="text-acid">Psychedelic</span>
            <br />
            <span className="text-magenta">realism</span>
          </h1>

          {studio.tagline ? (
            <p className="text-foreground-secondary max-w-lg text-base leading-relaxed sm:text-lg">
              {studio.tagline}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="tracking-label rounded-none font-mono text-xs uppercase"
            >
              <Link href="/store/gallery">
                See the gallery
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
            >
              <Link href="/store/commission">Commission a piece</Link>
            </Button>
          </div>
        </div>

        <HeroCarousel paintings={paintings} />
      </div>
    </section>
  );
}
