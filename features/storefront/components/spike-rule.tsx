import { cn } from '@/lib/utils';

const TEETH = 24;
const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 12;

/** Zigzag traced once across the viewBox, stretched to whatever width it lands in. */
const SPIKE_PATH = Array.from({ length: TEETH * 2 + 1 }, (_, step) => {
  const x = (step * VIEW_WIDTH) / (TEETH * 2);
  const y = step % 2 === 0 ? VIEW_HEIGHT : 0;
  return `${step === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y}`;
}).join(' ');

/**
 * The section divider: the same spine the pufferfish are drawn with, used as a
 * rule. Decorative only, so it is hidden from assistive tech, and it stretches
 * rather than tiles so the teeth stay aligned to the container edges.
 */
export function SpikeRule({
  className,
  mirrored = false,
}: {
  className?: string;
  /** Reflects the zigzag about its own axis, giving the symmetry the idiom
   *  leans on. Costs one extra path and no extra markup. */
  mirrored?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('text-voltage/60 h-2.5 w-full', className)}
    >
      <path
        d={SPIKE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {mirrored ? (
        <path
          d={SPIKE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          opacity={0.55}
          transform={`scale(1 -1) translate(0 -${VIEW_HEIGHT})`}
        />
      ) : null}
    </svg>
  );
}
