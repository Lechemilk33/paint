import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { MEDIA, RECORDS, blobStore } from '@/lib/storage/blobs';
import {
  RESERVED_SLUGS,
  paintingSchema,
  slugify,
  type Painting,
  type PaintingInput,
  type Photo,
} from './schema';

/**
 * The whole catalog lives in one JSON blob rather than a blob per painting.
 * A studio catalog is tens of records, not millions, and one document makes a
 * list a single read instead of an N+1 fan-out across the network - which is
 * what dominates latency on a blob store. Writes are read-modify-write; with a
 * single admin there is no contention to speak of. If this ever grows past a
 * few thousand pieces, or gains a second writer, that is the moment to move to
 * Postgres - every caller goes through the functions below, so the swap is
 * contained to this file.
 */
const CATALOG_KEY = 'catalog';

interface CatalogDocument {
  paintings: Painting[];
}

async function readCatalog(): Promise<Painting[]> {
  const doc = await blobStore(RECORDS).getJSON<CatalogDocument>(CATALOG_KEY);
  if (!doc?.paintings) return [];
  // Parse rather than trust: a record written by an older shape of the app
  // should surface here, not halfway through rendering a page.
  const parsed = paintingSchema.array().safeParse(doc.paintings);
  if (!parsed.success) {
    throw new Error(`Stored catalog does not match the current schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function writeCatalog(paintings: Painting[]): Promise<void> {
  await blobStore(RECORDS).setJSON(CATALOG_KEY, { paintings } satisfies CatalogDocument);
}

/** Newest first, which is the order the admin list and the storefront both want. */
export async function listPaintings(): Promise<Painting[]> {
  const paintings = await readCatalog();
  return paintings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPaintingById(id: string): Promise<Painting | null> {
  return (await readCatalog()).find((painting) => painting.id === id) ?? null;
}

export async function getPaintingBySlug(slug: string): Promise<Painting | null> {
  return (await readCatalog()).find((painting) => painting.slug === slug) ?? null;
}

/**
 * A slug unique across the catalog. Collisions get a numeric suffix rather
 * than a random one, so two pieces called "Untitled" read as untitled and
 * untitled-2 instead of something opaque.
 */
function uniqueSlug(title: string, paintings: Painting[], exceptId?: string): string {
  const base = slugify(title);
  const taken = new Set(
    paintings.filter((painting) => painting.id !== exceptId).map((painting) => painting.slug),
  );
  for (const reserved of RESERVED_SLUGS) taken.add(reserved);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export async function createPainting(input: PaintingInput): Promise<Painting> {
  const paintings = await readCatalog();
  const now = new Date().toISOString();
  const painting: Painting = {
    ...input,
    id: randomUUID(),
    slug: uniqueSlug(input.title, paintings),
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeCatalog([...paintings, painting]);
  return painting;
}

export async function updatePainting(id: string, input: PaintingInput): Promise<Painting> {
  const paintings = await readCatalog();
  const index = paintings.findIndex((painting) => painting.id === id);
  if (index === -1) throw new Error(`No painting with id ${id}`);

  const existing = paintings[index];
  const updated: Painting = {
    ...existing,
    ...input,
    // Retitling moves the piece's public URL. That is the intended behaviour -
    // the slug should follow the title - but it does break any link already
    // shared for the old one.
    slug:
      input.title === existing.title
        ? existing.slug
        : uniqueSlug(input.title, paintings, id),
    updatedAt: new Date().toISOString(),
  };
  paintings[index] = updated;
  await writeCatalog(paintings);
  return updated;
}

export async function deletePainting(id: string): Promise<void> {
  const paintings = await readCatalog();
  const painting = paintings.find((candidate) => candidate.id === id);
  if (!painting) return;

  // Drop the image bytes first. A failure here leaves orphaned blobs, which is
  // wasteful but harmless; the reverse order would leave the catalog pointing
  // at images that no longer exist.
  await Promise.all(painting.photos.map((photo) => blobStore(MEDIA).delete(photo.key)));
  await writeCatalog(paintings.filter((candidate) => candidate.id !== id));
}

/** The largest edge we keep. Beyond this is more pixels than any layout uses. */
const MAX_EDGE = 2000;

/**
 * Stores an uploaded image against a painting.
 *
 * Uploads come straight off a phone, so they are frequently 4000px HEIC-sized
 * JPEGs with an orientation flag. Everything is rotated upright, bounded, and
 * re-encoded to WebP on the way in - so the bytes in storage are the bytes
 * served, and no request-time image pipeline is needed.
 */
export async function addPhoto(
  paintingId: string,
  file: { buffer: Buffer; alt?: string },
): Promise<Photo> {
  const paintings = await readCatalog();
  const index = paintings.findIndex((painting) => painting.id === paintingId);
  if (index === -1) throw new Error(`No painting with id ${paintingId}`);

  const processed = await sharp(file.buffer)
    .rotate() // honour EXIF orientation, then drop it
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const photo: Photo = {
    id: randomUUID(),
    key: `photo/${randomUUID()}.webp`,
    contentType: 'image/webp',
    width: processed.info.width,
    height: processed.info.height,
    bytes: processed.data.byteLength,
    alt: file.alt?.trim() ?? '',
    position: paintings[index].photos.length,
  };

  await blobStore(MEDIA).setBuffer(photo.key, processed.data);
  paintings[index] = {
    ...paintings[index],
    photos: [...paintings[index].photos, photo],
    updatedAt: new Date().toISOString(),
  };
  await writeCatalog(paintings);
  return photo;
}

export async function deletePhoto(paintingId: string, photoId: string): Promise<void> {
  const paintings = await readCatalog();
  const index = paintings.findIndex((painting) => painting.id === paintingId);
  if (index === -1) return;

  const photo = paintings[index].photos.find((candidate) => candidate.id === photoId);
  if (!photo) return;

  await blobStore(MEDIA).delete(photo.key);
  paintings[index] = {
    ...paintings[index],
    // Re-index so positions stay dense; a gap would make "first photo" depend
    // on sort stability rather than on the number.
    photos: paintings[index].photos
      .filter((candidate) => candidate.id !== photoId)
      .sort((a, b) => a.position - b.position)
      .map((candidate, position) => ({ ...candidate, position })),
    updatedAt: new Date().toISOString(),
  };
  await writeCatalog(paintings);
}

/** Applies a new gallery order. Ids not listed keep their relative order after. */
export async function reorderPhotos(paintingId: string, photoIds: string[]): Promise<void> {
  const paintings = await readCatalog();
  const index = paintings.findIndex((painting) => painting.id === paintingId);
  if (index === -1) return;

  const rank = new Map(photoIds.map((id, position) => [id, position]));
  paintings[index] = {
    ...paintings[index],
    photos: [...paintings[index].photos]
      .sort(
        (a, b) =>
          (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.position - b.position,
      )
      .map((photo, position) => ({ ...photo, position })),
    updatedAt: new Date().toISOString(),
  };
  await writeCatalog(paintings);
}

export async function updatePhotoAlt(
  paintingId: string,
  photoId: string,
  alt: string,
): Promise<void> {
  const paintings = await readCatalog();
  const index = paintings.findIndex((painting) => painting.id === paintingId);
  if (index === -1) return;

  paintings[index] = {
    ...paintings[index],
    photos: paintings[index].photos.map((photo) =>
      photo.id === photoId ? { ...photo, alt: alt.trim() } : photo,
    ),
    updatedAt: new Date().toISOString(),
  };
  await writeCatalog(paintings);
}

/** Raw bytes for serving, looked up by photo id rather than storage key. */
export async function readPhotoBytes(
  photoId: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const paintings = await readCatalog();
  for (const painting of paintings) {
    const photo = painting.photos.find((candidate) => candidate.id === photoId);
    if (!photo) continue;
    const body = await blobStore(MEDIA).getBuffer(photo.key);
    return body ? { body, contentType: photo.contentType } : null;
  }
  return null;
}
