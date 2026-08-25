import type { Metadata } from 'next';
import { PaintingGrid } from '@/features/storefront/components/painting-grid';
import { SpikeRule } from '@/features/storefront/components/spike-rule';
import { listVisiblePaintings } from '@/lib/paintings/public';
import { getStudio } from '@/lib/studio/repository';
import { studioName } from '@/lib/studio/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const studio = await getStudio();
  return {
    title: `Gallery — ${studioName(studio)}`,
    description: 'Every painting currently on the wall.',
  };
}

export default async function GalleryPage() {
  const paintings = await listVisiblePaintings();
  const available = paintings.filter((p) => p.availability === 'available').length;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-8 sm:px-8">
      <SpikeRule className="text-magenta/50" mirrored />

      <div className="mt-10 mb-10 flex flex-col gap-3">
        <h1 className="font-poster text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-5xl">
          The <span className="text-voltage">gallery</span>
        </h1>
        <p className="text-muted-foreground tracking-label font-mono text-xs uppercase">
          {paintings.length} {paintings.length === 1 ? 'piece' : 'pieces'}
          {available > 0 ? ` · ${available} available` : ''}
        </p>
      </div>

      <PaintingGrid paintings={paintings} />
    </div>
  );
}
