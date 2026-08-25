import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { DeletePaintingButton } from '@/features/admin/components/delete-painting-button';
import { PaintingForm } from '@/features/admin/components/painting-form';
import { PhotoManager } from '@/features/admin/components/photo-manager';
import { getPaintingById } from '@/lib/paintings/repository';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const painting = await getPaintingById(id);
  return { title: painting ? `${painting.title} — Voltage Reef studio` : 'Not found' };
}

export default async function EditPaintingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const painting = await getPaintingById(id);
  if (!painting) notFound();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/admin">
            <ArrowLeft />
            All paintings
          </Link>
        </Button>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{painting.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              /store/{painting.slug}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/store/${painting.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink />
              View
            </Link>
          </Button>
        </div>

        {created ? (
          <p
            role="status"
            className="border-success/40 bg-success-subtle text-success mb-8 rounded-md border px-3 py-2 text-sm"
          >
            Painting created. Add its photos below - it will not appear on the store until it has
            at least one.
          </p>
        ) : null}

        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold tracking-tight">Photos</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            The first photo is the one the store uses on cards and link previews.
          </p>
          <PhotoManager painting={painting} />
        </section>

        <Separator className="mb-10" />

        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Details</h2>
          <PaintingForm painting={painting} />
        </section>

        <Separator className="my-10" />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Danger zone</h2>
          <p className="text-muted-foreground text-sm">
            Deleting removes the painting and every photo attached to it. This cannot be undone.
          </p>
          <DeletePaintingButton paintingId={painting.id} title={painting.title} />
        </section>
      </main>
    </>
  );
}
