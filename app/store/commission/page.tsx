import type { Metadata } from 'next';
import { EnquiryForm } from '@/features/enquiries/components/enquiry-form';
import { SpikeRule } from '@/features/storefront/components/spike-rule';
import { STUDIO } from '@/features/storefront/studio';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Commission a painting — ${STUDIO.name}`,
  description:
    'Commission an original psychedelic realism painting. Tell the studio what you want painted, the size and the budget, and it will reply with a price and a timeline.',
};

export default function CommissionPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-12 pb-24 sm:px-8">
      <SpikeRule className="text-acid/50" />

      <h1 className="font-poster mt-10 text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl">
        Commission
        <span className="text-magenta"> a piece</span>
      </h1>
      <p className="text-foreground-secondary mt-5 max-w-xl text-base leading-relaxed sm:text-lg">
        The studio takes a small number of commissions at a time. Animals real and invented, drawn
        from your reference or from a description, painted the same way everything else here is:
        real anatomy, impossible colour, black contour, small canvas.
      </p>

      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          ['How it works', 'You send a brief, the studio replies with a price and a timeline.'],
          ['What it costs', 'Depends on size and complexity. The budget field keeps it honest.'],
          ['How long', 'Usually a few weeks once a piece starts, longer if the queue is full.'],
        ].map(([term, detail]) => (
          <div key={term} className="flex flex-col gap-1.5">
            <dt className="tracking-label text-voltage font-mono text-xs uppercase">{term}</dt>
            <dd className="text-muted-foreground text-sm leading-relaxed">{detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12">
        <SpikeRule className="text-magenta/40" />
      </div>

      <div className="mt-10">
        <EnquiryForm kind="commission" submitLabel="Send commission request" />
      </div>
    </div>
  );
}
