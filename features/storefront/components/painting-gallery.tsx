'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { orderedPhotos, photoUrl, type Painting } from '@/lib/paintings/schema';

/**
 * The painting, plus every other photo of it. Most pieces have one image and
 * the thumbnail strip stays hidden; where there are detail shots or a photo of
 * the piece hung, they sit under the main image as a row of thumbs.
 *
 * Selection is local state rather than a route param: it is a way of looking at
 * one piece, not a different page, and it should not add history entries.
 */
export function PaintingGallery({ painting }: { painting: Painting }) {
  const photos = orderedPhotos(painting);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = photos[activeIndex] ?? photos[0] ?? null;

  if (!active) {
    return (
      <div className="border-border text-muted-foreground grid aspect-square place-items-center border">
        <ImageOff className="size-10" />
        <span className="sr-only">No photograph of this piece yet</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div aria-hidden="true" className="bg-magenta/25 absolute -inset-4 -z-10 blur-3xl" />
        <Image
          key={active.id}
          src={photoUrl(active)}
          alt={active.alt || painting.title}
          width={active.width}
          height={active.height}
          priority
          sizes="(min-width: 1024px) 55vw, 92vw"
          className="border-border h-auto w-full border shadow-lg"
        />
      </div>

      {photos.length > 1 ? (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={`Photographs of ${painting.title}`}
        >
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1} of ${photos.length}`}
              aria-current={index === activeIndex}
              className={cn(
                'focus-visible:ring-ring focus-visible:ring-offset-background relative size-16 overflow-hidden border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:size-20',
                index === activeIndex
                  ? 'border-magenta'
                  : 'border-border hover:border-voltage/60',
              )}
            >
              <Image
                src={photoUrl(photo)}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
