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
        The way back into the studio. A colophon line rather than a labelled
        button: it sits on every public page and a visitor reading about a
        painting has no use for it, so it stays muted until looked at. It does
        carry a word, though - a bare mark gave nothing to aim at, and something
        nobody can find is not discreet, just broken.

        Quiet, not hidden. The admin is gated in proxy.ts, so nothing here is
        holding a door shut, and hiding it from assistive tech would cost real
        accessibility while buying no security at all.
      */}
      <div className="mx-auto flex w-full max-w-7xl justify-end px-5 pb-10 sm:px-8">
        <Link
          href="/admin"
          rel="nofollow"
          aria-label="Studio admin"
          className="group text-muted-foreground/70 hover:text-voltage focus-visible:text-voltage focus-visible:ring-ring tracking-label -m-2 inline-flex items-center gap-2 rounded-xs p-2 font-mono text-xs uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {/*
            The same rotated square the header sets beside the wordmark, so the
            pair reads as the site's own furniture. Drawn rather than typed: a
            text diamond can fall back to a different shape in a font without
            one. The negative margin lets the padding grow the tap target
            without pushing the line off the footer's right edge.
          */}
          <span
            aria-hidden="true"
            className="bg-muted-foreground/70 group-hover:bg-voltage group-focus-visible:bg-voltage size-2 rotate-45 transition-colors"
          />
          Studio
        </Link>
      </div>
    </footer>
  );
}
