import Link from 'next/link';
import Image from 'next/image';
import { ImageOff, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { AvailabilitySelect } from '@/features/admin/components/availability-select';
import { listPaintings } from '@/lib/paintings/repository';
import { AVAILABILITY_LABEL, EDITION_LABEL, photoUrl, primaryPhoto } from '@/lib/paintings/schema';

// The catalog is edited from this very page, so it must never be served from a
// cached render - a stale list here looks like a save that silently failed.
export const dynamic = 'force-dynamic';

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function AdminDashboardPage() {
  const paintings = await listPaintings();
  const forSale = paintings.filter((painting) => painting.availability === 'available').length;
  const missingPhotos = paintings.filter((painting) => painting.photos.length === 0).length;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Paintings</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {paintings.length} {paintings.length === 1 ? 'piece' : 'pieces'} · {forSale}{' '}
              available
              {missingPhotos > 0 ? ` · ${missingPhotos} with no photo` : ''}
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/paintings/new">
              <Plus />
              New painting
            </Link>
          </Button>
        </div>

        {paintings.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-12 text-center">
            <h2 className="text-sm font-medium">No paintings yet</h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Add the first piece and it will appear on the store as soon as it has a photo.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/paintings/new">
                <Plus />
                New painting
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3">
            {paintings.map((painting) => {
              const photo = primaryPhoto(painting);
              return (
                <li
                  key={painting.id}
                  className="border-border bg-card flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <Link
                    href={`/admin/paintings/${painting.id}`}
                    className="focus-visible:ring-ring bg-muted relative aspect-square w-full shrink-0 overflow-hidden rounded-md focus-visible:ring-2 focus-visible:outline-none sm:size-20"
                  >
                    {photo ? (
                      <Image
                        src={photoUrl(photo)}
                        alt={photo.alt || painting.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground grid size-full place-items-center">
                        <ImageOff className="size-5" />
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/paintings/${painting.id}`}
                      className="hover:text-primary font-medium"
                    >
                      {painting.title}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {painting.year} · {painting.heightIn}x{painting.widthIn} in ·{' '}
                      {priceFormatter.format(painting.priceCents / 100)}
                      {painting.series ? ` · ${painting.series}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{EDITION_LABEL[painting.edition]}</Badge>
                      {painting.photos.length === 0 ? (
                        <Badge variant="destructive">No photo</Badge>
                      ) : (
                        <Badge variant="ghost" className="text-muted-foreground">
                          {painting.photos.length}{' '}
                          {painting.photos.length === 1 ? 'photo' : 'photos'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AvailabilitySelect
                      paintingId={painting.id}
                      value={painting.availability}
                      label={AVAILABILITY_LABEL[painting.availability]}
                    />
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/paintings/${painting.id}`}>Edit</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
