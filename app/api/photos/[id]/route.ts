import { readPhotoBytes } from '@/lib/paintings/repository';

/**
 * Serves a painting photo out of blob storage.
 *
 * The blob store has no public URLs, so the app is the only way in. Photos are
 * immutable once uploaded - editing one means uploading a replacement, which
 * gets a fresh id - so responses can be cached hard and forever by anything
 * downstream.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const photo = await readPhotoBytes(id);
  if (!photo) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(photo.body), {
    headers: {
      'content-type': photo.contentType,
      'content-length': String(photo.body.byteLength),
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
