import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { fetchPaintingBySlug, paintingSlugs, STUDIO } from '@/features/storefront/catalog';
import { PaintingDetail } from '@/features/storefront/components/painting-detail';
import {
  paintingDetailOptions,
  paintingListOptions,
  seriesListOptions,
} from '@/features/storefront/queries';

export function generateStaticParams() {
  return paintingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const painting = await fetchPaintingBySlug(slug);
  if (!painting) return { title: `Not found — ${STUDIO.name}` };

  return {
    title: `${painting.title} (${painting.year}) — ${STUDIO.name}`,
    description: painting.blurb,
    openGraph: {
      title: `${painting.title} — ${STUDIO.name}`,
      description: painting.blurb,
      images: [{ url: painting.image.src, alt: painting.image.alt }],
    },
  };
}

export default async function PaintingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await fetchPaintingBySlug(slug))) notFound();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(paintingDetailOptions(slug));
  // The list and series feed the spec panel and the same-series rail below.
  void queryClient.prefetchQuery(paintingListOptions());
  void queryClient.prefetchQuery(seriesListOptions());

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-4 sm:px-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaintingDetail slug={slug} />
      </HydrationBoundary>
    </div>
  );
}
