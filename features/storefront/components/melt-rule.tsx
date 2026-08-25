import { cn } from '@/lib/utils';

const WAVE_WIDTH = 240;
const WAVE_HEIGHT = 16;
const LOBES = 6;

/**
 * A single sine-ish lobe traced with cubic curves, repeated across the viewBox.
 * Drawn twice end to end so the track can slide exactly one copy's width and
 * loop with no visible seam.
 */
const LOBE = WAVE_WIDTH / LOBES;
const WAVE = Array.from({ length: LOBES * 2 }, (_, i) => {
  const x = i * LOBE;
  const mid = WAVE_HEIGHT / 2;
  // Alternate the bulge so the line reads as a wave rather than a row of humps.
  const peak = i % 2 === 0 ? 1 : WAVE_HEIGHT - 1;
  return `C${(x + LOBE * 0.35).toFixed(2)} ${peak}, ${(x + LOBE * 0.65).toFixed(2)} ${peak}, ${(x + LOBE).toFixed(2)} ${mid}`;
}).join(' ');

/**
 * The counterpart to the spike rule: where that one is all hard contour, this
 * one melts.
 *
 * Psychedelic form is characterized as much by fluid, transforming contour as
 * by color, and a shop built only from zigzags reads as aggressive rather than
 * hallucinatory. The wave drifts sideways so the contour never quite settles -
 * held still under prefers-reduced-motion, where a permanently creeping line is
 * exactly the wrong thing.
 *
 * Decorative, so it is hidden from assistive tech.
 */
export function MeltRule({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('h-4 w-full overflow-hidden', className)}>
      <div className="storefront-melt-track w-[200%]">
        <svg
          viewBox={`0 0 ${WAVE_WIDTH * 2} ${WAVE_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-4 w-full"
        >
          <path
            d={`M0 ${WAVE_HEIGHT / 2} ${WAVE}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
