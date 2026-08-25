import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaintingDetail } from '@/features/storefront/components/painting-detail';
import { getStudio } from '@/lib/studio/repository';
import { studioName } from '@/lib/studio/schema';
import { getVisiblePaintingBySlug, listVisiblePaintings } from '@/lib/paintings/public';
import { photoUrl, primaryPhoto } from '@/lib/paintings/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [painting, studio] = await Promise.all([getVisiblePaintingBySlug(slug), getStudio()]);
  const name = studioName(studio);
  if (!painting) return { title: `Not found — ${name}` };

  const photo = primaryPhoto(painting);
  return {
    title: `${painting.title} (${painting.year}) — ${name}`,
    description: painting.blurb,
    openGraph: {
      title: `${painting.title} — ${name}`,
      description: painting.blurb,
      images: photo ? [{ url: photoUrl(photo), alt: photo.alt || painting.title }] : [],
    },
  };
}

export default async function PaintingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  /**
   * `?ask=` names which of the three requests to open. It exists so the ask
   * block degrades: without JavaScript the buttons are ordinary links, this
   * reads what they asked for, and the right form is rendered on the server.
   * With JavaScript the click is intercepted and nothing is fetched. It also
   * makes each form linkable, which is worth something on its own.
   */
  searchParams: Promise<{ ask?: string }>;
}) {
  const { slug } = await params;
  const [painting, paintings, studio, query] = await Promise.all([
    getVisiblePaintingBySlug(slug),
    listVisiblePaintings(),
    getStudio(),
    searchParams,
  ]);
  if (!painting) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-4 sm:px-8">
      <PaintingDetail
        painting={painting}
        paintings={paintings}
        studio={studio}
        ask={query.ask}
      />
    </div>
  );
}
