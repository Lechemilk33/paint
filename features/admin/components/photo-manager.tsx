'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { ArrowDown, ArrowUp, ImageUp, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { orderedPhotos, photoUrl, type Painting } from '@/lib/paintings/schema';
import { EMPTY_UPLOAD_STATE, type UploadState } from '../form-state';
import {
  deletePhotoAction,
  movePhotoAction,
  updatePhotoAltAction,
  uploadPhotosAction,
} from '../painting-actions';

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <ImageUp />
      {pending ? 'Uploading...' : 'Upload'}
    </Button>
  );
}

/** A small submit that shows nothing but its icon; used for the row controls. */
function IconAction({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={disabled || pending}
    >
      {children}
    </Button>
  );
}

export function PhotoManager({ painting }: { painting: Painting }) {
  const [state, formAction] = useActionState<UploadState, FormData>(
    uploadPhotosAction,
    EMPTY_UPLOAD_STATE,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const photos = orderedPhotos(painting);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="paintingId" value={painting.id} />
        <div className="space-y-1.5">
          <Label htmlFor="photos">Add photos</Label>
          <p className="text-muted-foreground text-xs">
            Several at once is fine. Each one is turned upright, bounded to 2000px and
            re-encoded, so straight off the phone is fine.
          </p>
          <Input
            ref={fileInput}
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="file:text-foreground cursor-pointer file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
            {state.uploaded > 0 ? ` (${state.uploaded} uploaded before this)` : ''}
          </p>
        ) : null}
        {!state.error && state.uploaded > 0 ? (
          <p role="status" className="text-success text-sm">
            Uploaded {state.uploaded} {state.uploaded === 1 ? 'photo' : 'photos'}.
          </p>
        ) : null}
        <UploadButton />
      </form>

      {photos.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No photos yet. The piece will not show an image on the store until one is added.
        </div>
      ) : (
        <ul className="space-y-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="border-border bg-card flex flex-wrap items-start gap-3 rounded-lg border p-3"
            >
              <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-md sm:size-28">
                <Image
                  src={photoUrl(photo)}
                  alt={photo.alt || `Photo ${index + 1} of ${painting.title}`}
                  fill
                  sizes="(min-width: 640px) 112px, 96px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {index === 0 ? (
                    <Badge className="gap-1">
                      <Star className="size-3" />
                      Primary
                    </Badge>
                  ) : (
                    <Badge variant="outline">Photo {index + 1}</Badge>
                  )}
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {photo.width}x{photo.height} · {Math.round(photo.bytes / 1024)}KB
                  </span>
                </div>

                <form action={updatePhotoAltAction} className="flex gap-2">
                  <input type="hidden" name="paintingId" value={painting.id} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <Input
                    name="alt"
                    defaultValue={photo.alt}
                    placeholder="Describe the image for screen readers"
                    className="h-8 text-sm"
                    aria-label={`Alt text for photo ${index + 1}`}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    Save
                  </Button>
                </form>
              </div>

              <div className="flex items-center gap-1 sm:flex-col">
                <form action={movePhotoAction}>
                  <input type="hidden" name="paintingId" value={painting.id} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="direction" value="up" />
                  <IconAction label="Move earlier" disabled={index === 0}>
                    <ArrowUp />
                  </IconAction>
                </form>
                <form action={movePhotoAction}>
                  <input type="hidden" name="paintingId" value={painting.id} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="direction" value="down" />
                  <IconAction label="Move later" disabled={index === photos.length - 1}>
                    <ArrowDown />
                  </IconAction>
                </form>
                <form action={deletePhotoAction}>
                  <input type="hidden" name="paintingId" value={painting.id} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <IconAction label={`Delete photo ${index + 1}`}>
                    <Trash2 className="text-destructive" />
                  </IconAction>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
