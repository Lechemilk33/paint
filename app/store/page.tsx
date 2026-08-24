import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { CatalogSection } from '@/features/storefront/components/catalog-section';
import { StoreHero } from '@/features/storefront/components/store-hero';
import { StoreTicker } from '@/features/storefront/components/store-ticker';
import { StudioNote } from '@/features/storefront/components/studio-note';
import { paintingListOptions, seriesListOptions } from '@/features/storefront/queries';

export default function StorePage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(paintingListOptions());
  void queryClient.prefetchQuery(seriesListOptions());

  return (
    <>
      <StoreHero />
      <StoreTicker />
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CatalogSection />
        </HydrationBoundary>
        <StudioNote />
      </div>
    </>
  );
}
