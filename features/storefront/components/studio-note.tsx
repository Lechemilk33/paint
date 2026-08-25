import type { Studio } from '@/lib/studio/schema';
import { SpikeRule } from './spike-rule';

/**
 * The studio in its own words.
 *
 * Renders nothing at all when nothing has been written. There used to be three
 * confident paragraphs here about wet-on-wet grounds and what is never
 * airbrushed; none of it came from the artist, so none of it belonged on their
 * shop. An absent section is honest. An invented one is not.
 */
export function StudioNote({ studio }: { studio: Studio }) {
  if (!studio.about) return null;

  return (
    <section id="studio" className="mt-24 flex scroll-mt-24 flex-col gap-10">
      <SpikeRule className="text-acid/50" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <h2 className="font-poster text-3xl leading-[0.95] font-extrabold tracking-tight sm:text-4xl">
          The studio
        </h2>
        {/* whitespace-pre-line so paragraph breaks typed in the admin survive. */}
        <p className="text-foreground-secondary max-w-2xl text-base leading-relaxed whitespace-pre-line">
          {studio.about}
        </p>
      </div>
    </section>
  );
}
