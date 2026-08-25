'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isSignedIn } from '@/lib/auth/session';
import {
  addPhoto,
  createPainting,
  getPaintingById,
  deletePainting,
  deletePhoto,
  reorderPhotos,
  updatePainting,
  updatePhotoAlt,
} from '@/lib/paintings/repository';
import { availabilitySchema, paintingInputSchema } from '@/lib/paintings/schema';
import type { Painting, PaintingInput } from '@/lib/paintings/schema';
import type { FormState, UploadState } from './form-state';

/**
 * Middleware already gates /admin, but a server action is its own HTTP
 * endpoint and can be invoked directly - so every action re-checks rather than
 * inheriting the page's protection.
 */
async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) {
    throw new Error('Not signed in');
  }
}

/** The editable subset of a stored record, for writes that change one field. */
function toInput(painting: Painting): PaintingInput {
  const { id, slug, photos, createdAt, updatedAt, ...input } = painting;
  void id, slug, photos, createdAt, updatedAt;
  return input;
}

/**
 * Everything arrives from a FormData as strings. Numbers are coerced here, at
 * the boundary, so the schema itself stays a description of the domain rather
 * than of HTML form encoding. Empty numeric fields become NaN rather than 0,
 * which is what makes "leave the price blank" an error instead of a free
 * painting.
 */
function readForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? '').trim();
  const number = (key: string) => {
    const raw = text(key);
    return raw === '' ? Number.NaN : Number(raw);
  };
  const dollars = number('priceUsd');

  return {
    title: text('title'),
    year: number('year'),
    medium: text('medium'),
    heightIn: number('heightIn'),
    widthIn: number('widthIn'),
    priceCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : Number.NaN,
    series: text('series'),
    blurb: text('blurb'),
    framingShipping: text('framingShipping'),
    story: text('story'),
    edition: text('edition'),
    availability: text('availability'),
    driveFolder: text('driveFolder'),
    notes: text('notes'),
  };
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    // The price field is `priceUsd` in the DOM but `priceCents` in the schema;
    // map it back so the message lands on the input the person actually typed in.
    const field = key === 'priceCents' ? 'priceUsd' : key;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

export async function createPaintingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = paintingInputSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: 'Check the highlighted fields', fieldErrors: toFieldErrors(parsed.error) };
  }

  const painting = await createPainting(parsed.data);
  revalidatePath('/admin');
  revalidatePath('/store');
  // Straight into the editor, because a new piece still needs its photos.
  redirect(`/admin/paintings/${painting.id}?created=1`);
}

export async function updatePaintingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing painting id', fieldErrors: {} };

  const parsed = paintingInputSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: 'Check the highlighted fields', fieldErrors: toFieldErrors(parsed.error) };
  }

  const painting = await updatePainting(id, parsed.data);
  revalidatePath('/admin');
  revalidatePath(`/admin/paintings/${id}`);
  revalidatePath('/store');
  revalidatePath(`/store/${painting.slug}`);
  return { error: null, fieldErrors: {} };
}

export async function deletePaintingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await deletePainting(id);
  revalidatePath('/admin');
  revalidatePath('/store');
  redirect('/admin');
}

/** Flips availability straight from the list, without opening the editor. */
export async function setAvailabilityAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  const availability = availabilitySchema.safeParse(formData.get('availability'));
  if (!id || !availability.success) return;

  const painting = await getPaintingById(id);
  if (!painting) return;

  await updatePainting(id, { ...toInput(painting), availability: availability.data });
  revalidatePath('/admin');
  revalidatePath('/store');
  revalidatePath(`/store/${painting.slug}`);
}

/** Guard rails on what a browser may hand the image pipeline. */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

/**
 * Accepts a multi-file selection for one painting. Files are processed one at
 * a time rather than in parallel: each one is decoded and re-encoded at full
 * resolution, and a phone-sized batch done concurrently is a reliable way to
 * exhaust the memory a serverless function gets.
 */
export async function uploadPhotosAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  await requireAdmin();

  const paintingId = String(formData.get('paintingId') ?? '');
  if (!paintingId) return { error: 'Missing painting id', uploaded: 0 };

  const files = formData.getAll('photos').filter((entry): entry is File => entry instanceof File);
  const present = files.filter((file) => file.size > 0);
  if (present.length === 0) return { error: 'Choose at least one image', uploaded: 0 };

  let uploaded = 0;
  for (const file of present) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: `${file.name} is larger than 20MB`, uploaded };
    }
    if (file.type && !ACCEPTED.includes(file.type)) {
      return { error: `${file.name} is not an image we can read`, uploaded };
    }
    try {
      await addPhoto(paintingId, { buffer: Buffer.from(await file.arrayBuffer()) });
      uploaded += 1;
    } catch (cause) {
      console.error('Photo upload failed', cause);
      return { error: `Could not process ${file.name}`, uploaded };
    }
  }

  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath('/store');
  return { error: null, uploaded };
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const paintingId = String(formData.get('paintingId') ?? '');
  const photoId = String(formData.get('photoId') ?? '');
  if (!paintingId || !photoId) return;

  await deletePhoto(paintingId, photoId);
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath('/store');
}

/** Moves one photo a single step. Position 0 is the piece's primary image. */
export async function movePhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const paintingId = String(formData.get('paintingId') ?? '');
  const photoId = String(formData.get('photoId') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (!paintingId || !photoId || (direction !== 'up' && direction !== 'down')) return;

  const painting = await getPaintingById(paintingId);
  if (!painting) return;

  const ordered = [...painting.photos].sort((a, b) => a.position - b.position);
  const index = ordered.findIndex((photo) => photo.id === photoId);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ordered.length) return;

  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await reorderPhotos(paintingId, ordered.map((photo) => photo.id));
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath('/store');
}

export async function updatePhotoAltAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const paintingId = String(formData.get('paintingId') ?? '');
  const photoId = String(formData.get('photoId') ?? '');
  if (!paintingId || !photoId) return;

  await updatePhotoAlt(paintingId, photoId, String(formData.get('alt') ?? ''));
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath('/store');
}
