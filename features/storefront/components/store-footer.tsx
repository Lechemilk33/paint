import { STUDIO } from '../catalog';
import { SpikeRule } from './spike-rule';

export function StoreFooter() {
  return (
    <footer className="mt-24">
      <SpikeRule className="text-magenta/50 h-3" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-poster text-2xl font-extrabold tracking-tight">{STUDIO.name}</p>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            {STUDIO.tagline}. Every piece is a one-off original on stretched canvas, sold unframed
            and shipped flat.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <a
            href={`mailto:${STUDIO.contactEmail}`}
            className="text-voltage hover:text-acid focus-visible:ring-ring font-mono text-sm tracking-wide underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {STUDIO.contactEmail}
          </a>
          <p className="text-muted-foreground font-mono text-xs tracking-label uppercase">
            Enquiries answered within a week
          </p>
        </div>
      </div>
    </footer>
  );
}
