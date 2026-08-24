import { SpikeRule } from './spike-rule';
import { PaintingGrid } from './painting-grid';

/** The catalog block: heading, rule, and the filterable grid. */
export function CatalogSection() {
  return (
    <section id="catalog" className="flex scroll-mt-24 flex-col gap-10 pt-20">
      <SpikeRule className="text-magenta/50" />
      <div className="flex flex-col gap-3">
        <h2 className="font-poster text-3xl font-extrabold tracking-tight sm:text-4xl">The work</h2>
        <p className="text-foreground-secondary max-w-2xl text-base leading-relaxed">
          Everything currently on the wall. Filter by series or by what is still going.
        </p>
      </div>
      <PaintingGrid />
    </section>
  );
}
