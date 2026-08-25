'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { photoUrl, primaryPhoto, type Painting } from '@/lib/paintings/schema';
import { StatusBadge } from './status-badge';

/** One full turn of the wheel. */
const INTERVAL_MS = 10_000;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Read as an external store, so there is no setState-in-effect and the server
 *  snapshot (motion allowed) is corrected on hydration. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * The wall, cycling.
 *
 * Every canvas is stacked in the same frame and cross-faded between, rather
 * than slid: these paintings are dense, saturated and edge-to-edge, and sliding
 * two of them past each other is visual noise on top of visual noise. A dissolve
 * lets one image resolve out of the other, which is closer to how the work
 * itself behaves - color arriving before the form does.
 *
 * The whole frame is a link to whichever piece is showing. Autoplay stops on
 * hover, on keyboard focus, when the tab is hidden, and entirely for anyone who
 * has asked for reduced motion - in which case it becomes a plain set of
 * buttons showing one piece at a time.
 */
export function HeroCarousel({ paintings }: { paintings: Painting[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const liveRef = useRef<HTMLParagraphElement>(null);

  const count = paintings.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (reducedMotion || isPaused || count < 2) return;

    // Only run while the tab is actually being looked at; a background tab
    // otherwise burns through the whole catalog unseen and comes back
    // somewhere arbitrary.
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      timer ??= setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    if (document.visibilityState === 'visible') start();
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion, isPaused, count]);

  if (count === 0) return null;
  const active = paintings[index];
  const activePhoto = primaryPhoto(active);

  return (
    <div
      className="flex flex-col gap-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label="Paintings"
    >
      <div className="relative">
        {/* The bloom behind the canvas picks up the piece's own energy without
            touching its color: a filter on the image would edit the work. */}
        <div
          aria-hidden="true"
          className="from-magenta/40 via-ultra/30 to-voltage/40 absolute -inset-6 -z-10 bg-gradient-to-tr blur-3xl transition-opacity duration-1000"
        />

        <Link
          href={`/store/${active.slug}`}
          className="group focus-visible:ring-ring focus-visible:ring-offset-background block focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
          aria-label={`${active.title}, ${active.year}`}
        >
          {/* A fixed square frame holds every canvas, so switching between a
              tall piece and a wide one does not shove the page around. */}
          {/* The vibrating edge: two near-complementary strokes at identical
              value, one inset inside the other. At rest they are dim; on hover
              they come up and the boundary between them buzzes rather than
              reading as a simple highlight. */}
          <div className="border-vibrate-a/40 group-hover:border-vibrate-a bg-ink/60 relative aspect-square overflow-hidden border transition-colors duration-500">
            <div
              aria-hidden="true"
              className="border-vibrate-b/0 group-hover:border-vibrate-b/90 pointer-events-none absolute inset-[3px] z-20 border transition-colors duration-500"
            />
            {paintings.map((painting, i) => {
              const photo = primaryPhoto(painting);
              if (!photo) return null;
              return (
                <Image
                  key={painting.id}
                  src={photoUrl(photo)}
                  alt={i === index ? photo.alt || painting.title : ''}
                  fill
                  // Only the visible one is eager; the rest arrive as needed.
                  priority={i === 0}
                  sizes="(min-width: 1024px) 42vw, 92vw"
                  aria-hidden={i === index ? undefined : true}
                  className={cn(
                    'object-contain transition-opacity duration-1000 ease-out',
                    i === index ? 'opacity-100' : 'opacity-0',
                  )}
                />
              );
            })}
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <StatusBadge availability={active.availability} />
        <p className="tracking-label font-mono text-xs uppercase">
          {active.title}, {active.year}
        </p>

        {count > 1 ? (
          <div className="ml-auto flex items-center gap-1.5">
            {paintings.map((painting, i) => (
              <button
                key={painting.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${painting.title}`}
                aria-current={i === index}
                className={cn(
                  'focus-visible:ring-ring focus-visible:ring-offset-background h-1.5 rounded-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  i === index
                    ? 'bg-magenta w-8'
                    : 'bg-border hover:bg-voltage w-4',
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Announced on change so the carousel is followable without sight; the
          images themselves are hidden from assistive tech except the current. */}
      <p ref={liveRef} aria-live="polite" className="sr-only">
        {active.title}, {active.year}. {index + 1} of {count}.
      </p>
      {activePhoto ? null : (
        <p className="text-muted-foreground text-xs">This piece has no photograph yet.</p>
      )}
    </div>
  );
}
