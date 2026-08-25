import Link from 'next/link';
import type { Studio } from '@/lib/studio/schema';
import { studioName } from '@/lib/studio/schema';
import { SpikeRule } from './spike-rule';

/**
 * Every line here is conditional. The footer previously stated how work was
 * stretched, framed and shipped, and how fast inquiries were answered - none
 * of which anyone had said. Now it shows what the studio has written and
 * nothing else.
 */
export function StoreFooter({ studio }: { studio: Studio }) {
  return (
    <footer className="mt-24">
      <SpikeRule className="text-magenta/50 h-3" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-poster text-2xl font-extrabold tracking-tight">{studioName(studio)}</p>
          {studio.tagline ? (
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              {studio.tagline}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Link
            href="/store/commission"
            className="text-voltage hover:text-acid focus-visible:ring-ring font-mono text-sm tracking-wide underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Commission a piece
          </Link>
          {studio.contactEmail ? (
            <a
              href={`mailto:${studio.contactEmail}`}
              className="text-muted-foreground hover:text-voltage focus-visible:ring-ring font-mono text-xs tracking-wide underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              {studio.contactEmail}
            </a>
          ) : null}
          {studio.responseTime ? (
            <p className="text-muted-foreground tracking-label font-mono text-xs uppercase">
              Inquiries answered {studio.responseTime}
            </p>
          ) : null}
        </div>
      </div>

      {/*
        The way back into the studio. Deliberately a printer's mark rather than
        a labelled link: it sits on every public page, and a visitor reading
        about a painting has no use for it. Quiet, not hidden - the admin is
        gated in proxy.ts, so nothing here is holding a door shut, and it keeps
        a real accessible name and a visible focus ring so it can still be
        reached by keyboard or screen reader.
      */}
      <div className="mx-auto flex w-full max-w-7xl justify-end px-5 pb-10 sm:px-8">
        <Link
          href="/admin"
          rel="nofollow"
          aria-label="Studio admin"
          title="Studio"
          className="group focus-visible:ring-ring inline-flex size-6 items-center justify-center rounded-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          {/*
            The same rotated square the header sets beside the wordmark, so it
            reads as the site's own furniture rather than a stray glyph - and
            unlike a text diamond it cannot fall back to a different shape in a
            font that lacks it. The link box is 24px for a fingertip while the
            mark itself stays 6px.
          */}
          <span
            aria-hidden="true"
            className="bg-muted-foreground/30 group-hover:bg-voltage group-focus-visible:bg-voltage size-1.5 rotate-45 transition-colors"
          />
        </Link>
      </div>
    </footer>
  );
}
