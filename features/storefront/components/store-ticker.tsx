const PHRASES = [
  'One of each',
  'Acrylic on canvas',
  'Painted by hand',
  'No prints, no editions',
  'Shipped flat, unframed',
  'Commissions open',
];

/**
 * The band under the hero. Decorative motion, hidden from assistive tech: the
 * same facts are stated plainly in the studio section and the footer, so nothing
 * is only available here.
 */
export function StoreTicker() {
  return (
    <div
      aria-hidden="true"
      className="border-border bg-ink/40 relative flex overflow-hidden border-y py-3 select-none"
    >
      <div className="storefront-ticker-track flex w-max shrink-0 items-center">
        {/* Rendered twice: the animation slides exactly one copy's width. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {PHRASES.map((phrase) => (
              <span key={phrase} className="flex shrink-0 items-center">
                <span className="text-foreground-secondary px-6 font-mono text-xs tracking-banner whitespace-nowrap uppercase">
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
