import { CatalogSection } from '@/features/storefront/components/catalog-section';
import { StoreHero } from '@/features/storefront/components/store-hero';
import { StoreTicker } from '@/features/storefront/components/store-ticker';
import { StudioNote } from '@/features/storefront/components/studio-note';
import { listVisiblePaintings } from '@/lib/paintings/public';

// The catalog is edited in the admin and must reflect those edits immediately,
// so this renders per request rather than being cached at build time.
export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const paintings = await listVisiblePaintings();
  const featured = paintings[0] ?? null;
  const available = paintings.filter((painting) => painting.availability === 'available').length;

  return (
    <>
      {featured ? (
        <StoreHero
          painting={featured}
          totalCount={paintings.length}
          availableCount={available}
        />
      ) : null}
      <StoreTicker />
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <CatalogSection paintings={paintings} />
        <StudioNote />
      </div>
    </>
  );
}
