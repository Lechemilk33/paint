import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaintingCard } from '@/features/storefront/components/painting-card';
import { MeltRule } from '@/features/storefront/components/melt-rule';
import { SpikeRule } from '@/features/storefront/components/spike-rule';
import { StoreHero } from '@/features/storefront/components/store-hero';
import { StoreTicker } from '@/features/storefront/components/store-ticker';
import { StudioNote } from '@/features/storefront/components/studio-note';
import { listVisiblePaintings } from '@/lib/paintings/public';
import { getStudio } from '@/lib/studio/repository';

// The catalog is edited in the admin and must reflect those edits immediately,
// so this renders per request rather than being cached at build time.
export const dynamic = 'force-dynamic';

/** How many pieces the home page shows before handing off to the gallery. */
const PREVIEW_COUNT = 6;

export default async function StorePage() {
  const [paintings, studio] = await Promise.all([listVisiblePaintings(), getStudio()]);
  const available = paintings.filter((painting) => painting.availability === 'available').length;
  const preview = paintings.slice(0, PREVIEW_COUNT);

  return (
    <>
      {paintings.length > 0 ? (
        <StoreHero paintings={paintings} studio={studio} availableCount={available} />
      ) : null}

      <StoreTicker studio={studio} />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {preview.length > 0 ? (
          <section className="flex flex-col gap-10 pt-20">
            <SpikeRule className="text-magenta/50" mirrored />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-poster text-3xl leading-[0.95] font-extrabold tracking-tight sm:text-4xl">
                Recent <span className="text-acid">work</span>
              </h2>
              <Button
                asChild
                variant="outline"
                className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
              >
                <Link href="/store/gallery">
                  All {paintings.length} pieces
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((painting, index) => (
                <PaintingCard key={painting.id} painting={painting} priority={index < 3} />
              ))}
            </div>
          </section>
        ) : (
          <section className="border-border mt-20 border border-dashed p-12 text-center">
            <p className="font-poster text-xl font-extrabold">The wall is empty</p>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              Paintings appear here as soon as they are added in the studio.
            </p>
          </section>
        )}

        <MeltRule className="text-voltage/40 mt-24" />
        <StudioNote studio={studio} />
      </div>
    </>
  );
}
