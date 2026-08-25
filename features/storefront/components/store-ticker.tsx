import type { Studio } from '@/lib/studio/schema';

/**
 * The band under the hero.
 *
 * Its phrases come from the studio settings and nowhere else: it used to
 * announce shipping terms and editioning policy that no one had actually
 * stated. With nothing written it does not render, which is the correct
 * amount of marquee for a shop with nothing to put in one.
 *
 * Decorative, so it is hidden from assistive tech - motion carrying no
 * information a screen reader would want.
 */
export function StoreTicker({ studio }: { studio: Studio }) {
  if (studio.marquee.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="border-border bg-ink/40 relative flex overflow-hidden border-y py-3 select-none"
    >
      <div className="storefront-ticker-track flex w-max shrink-0 items-center">
        {/* Rendered twice: the animation slides exactly one copy's width. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {studio.marquee.map((phrase, index) => (
              <span key={`${phrase}-${index}`} className="flex shrink-0 items-center">
                <span className="text-foreground-secondary tracking-banner px-6 font-mono text-xs whitespace-nowrap uppercase">
                  {phrase}
                </span>
                <span className="bg-magenta size-1.5 shrink-0 rotate-45" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
