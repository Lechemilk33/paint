import type { Metadata } from 'next';
import { EnquiryForm } from '@/features/enquiries/components/enquiry-form';
import { MeltRule } from '@/features/storefront/components/melt-rule';
import { SpikeRule } from '@/features/storefront/components/spike-rule';
import { getStudio } from '@/lib/studio/repository';
import { studioName } from '@/lib/studio/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const studio = await getStudio();
  return {
    title: `Commission — ${studioName(studio)}`,
    description: 'Request an original psychedelic realism painting.',
  };
}

export default async function CommissionPage() {
  const studio = await getStudio();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-12 pb-24 sm:px-8">
      <SpikeRule className="text-acid/50" mirrored />

      <h1 className="font-poster mt-10 text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl">
        Commission
        <span className="text-magenta"> a piece</span>
      </h1>
      <p className="text-foreground-secondary mt-5 max-w-xl text-base leading-relaxed sm:text-lg">
        Tell the studio what you would like painted. Send a brief and it will come back to you
        with what it would cost and how long it would take.
      </p>

      {studio.responseTime ? (
        <p className="text-muted-foreground tracking-label mt-4 font-mono text-xs uppercase">
          Enquiries answered {studio.responseTime}
        </p>
      ) : null}

      <div className="mt-12">
        <MeltRule className="text-magenta/50" />
      </div>

      <div className="mt-10">
        <EnquiryForm kind="commission" submitLabel="Send commission request" />
      </div>
    </div>
  );
}
