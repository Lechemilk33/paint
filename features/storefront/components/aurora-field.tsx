import { cn } from '@/lib/utils';

/**
 * The ambient wash behind the hero: three soft radial pools in the canvas
 * palette, the closest a flat screen gets to the wet-blended grounds the
 * paintings sit on. Radial gradients have no token utility, so the stops are
 * written inline - every color is still a token, none is a literal.
 */
export function AuroraField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{
        background: [
          'radial-gradient(60% 55% at 18% 12%, color-mix(in oklab, var(--magenta) 28%, transparent), transparent 70%)',
          'radial-gradient(55% 50% at 82% 26%, color-mix(in oklab, var(--voltage) 22%, transparent), transparent 72%)',
          'radial-gradient(70% 60% at 50% 100%, color-mix(in oklab, var(--ultra) 40%, transparent), transparent 75%)',
        ].join(', '),
      }}
    />
  );
}
