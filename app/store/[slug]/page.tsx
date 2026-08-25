import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaintingDetail } from '@/features/storefront/components/painting-detail';
import { STUDIO } from '@/features/storefront/studio';
import { getVisiblePaintingBySlug, listVisiblePaintings } from '@/lib/paintings/public';
import { photoUrl, primaryPhoto } from '@/lib/paintings/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const painting = await getVisiblePaintingBySlug(slug);
  if (!painting) return { title: `Not found — ${STUDIO.name}` };

  const photo = primaryPhoto(painting);
  return {
    title: `${painting.title} (${painting.year}) — ${STUDIO.name}`,
    description: painting.blurb,
    openGraph: {
      title: `${painting.title} — ${STUDIO.name}`,
      description: painting.blurb,
      images: photo ? [{ url: photoUrl(photo), alt: photo.alt || painting.title }] : [],
    },
  };
}

export default async function PaintingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [painting, paintings] = await Promise.all([
    getVisiblePaintingBySlug(slug),
    listVisiblePaintings(),
  ]);
  if (!painting) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-4 sm:px-8">
      <PaintingDetail painting={painting} paintings={paintings} />
    </div>
  );
}
