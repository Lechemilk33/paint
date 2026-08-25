/**
 * Seeds the catalog with the five paintings the storefront launched with, and
 * uploads their images through the same pipeline the admin uses.
 *
 * Safe to re-run: it skips any painting whose slug is already present, so it
 * can be pointed at a live store to add only what is missing.
 *
 *   node scripts/seed.mjs
 *
 * Off Netlify this writes to .netlify/local-blobs, which is what `next dev`
 * reads. To seed the deployed store instead, run it through the Netlify CLI so
 * the blob context is injected:  netlify dev:exec node scripts/seed.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { addPhoto, createPainting, listPaintings, updatePhotoAlt } from '@/lib/paintings/repository';
import type { Availability, Edition } from '@/lib/paintings/schema';

const root = process.cwd();

interface Seed {
  file: string;
  title: string;
  year: number;
  series: string;
  medium: string;
  heightIn: number;
  widthIn: number;
  priceCents: number;
  availability: Availability;
  edition: Edition;
  blurb: string;
  framingShipping: string;
  story: string;
  alt: string;
}

const PAINTINGS: Seed[] = [
  {
    file: 'deep-voltage.webp',
    title: 'Deep Voltage',
    year: 2024,
    series: 'The Puffer Cycle',
    medium: 'Acrylic on stretched canvas',
    heightIn: 10,
    widthIn: 10,
    priceCents: 68000,
    availability: 'available',
    edition: 'original',
    blurb: 'Cobalt and magenta puffer, spines thrown wide against a tie-dyed current.',
    framingShipping: 'Unframed on stretched canvas, shipped flat and tracked.',
    story:
      'The ground was laid in first as a wet-on-wet swirl of viridian, cobalt and chartreuse, then the fish was cut back into it in opaque strokes. Every spine is a single unbroken pull of the brush, which is why they taper the way real ones do. The eyes carry two different worlds: one is a cool blue vortex, the other a coiled band of amber, and the white catchlights are the last two marks made on the canvas.',
    alt: 'Acrylic painting of a pufferfish in cobalt and magenta with long cyan spines, on a swirled blue and green ground.',
  },
  {
    file: 'acid-grin.webp',
    title: 'Acid Grin',
    year: 2024,
    series: 'The Puffer Cycle',
    medium: 'Acrylic and ink on stretched canvas',
    heightIn: 10,
    widthIn: 8,
    priceCents: 54000,
    availability: 'available',
    edition: 'original',
    blurb: 'Chartreuse puffer, black zigzag contour, and a mouth that knows something.',
    framingShipping: 'Unframed on stretched canvas, shipped flat and tracked.',
    story:
      'Painted in near-fluorescent yellow-green over a flat cobalt field, then outlined entirely in black ink while the acrylic was still cold. The contour is drawn as a zigzag rather than a smooth line, so the silhouette buzzes at the edges. Flicked ink spatter across the lower ground was left exactly where it landed.',
    alt: 'Acrylic painting of a pufferfish in acid green and yellow with black zigzag outlines, on a deep blue splattered ground.',
  },
  {
    file: 'bubblegum-pressure.webp',
    title: 'Bubblegum Pressure',
    year: 2025,
    series: 'The Puffer Cycle',
    medium: 'Acrylic on stretched canvas',
    heightIn: 8,
    widthIn: 8,
    priceCents: 52000,
    availability: 'on_hold',
    edition: 'original',
    blurb: 'Pink under pressure, yellow-eyed, with two spiral bubbles for company.',
    framingShipping: 'Unframed on stretched canvas, shipped flat and tracked.',
    story:
      'The most frontal of the puffers: the fish sits dead center and the whole cyan ground is raked outward from it in short vertical strokes, so the background reads as pressure rather than water. Spines run from carmine through magenta to near-black. The two spiral bubbles in the lower right were added last, the only marks on the canvas that curl instead of point.',
    alt: 'Acrylic painting of a pink pufferfish with magenta spines and yellow eyes, on a raked cyan ground with two spiral bubbles.',
  },
  {
    file: 'nightshift.webp',
    title: 'Nightshift',
    year: 2025,
    series: 'Night Fauna',
    medium: 'Acrylic on stretched canvas',
    heightIn: 12,
    widthIn: 9,
    priceCents: 96000,
    availability: 'available',
    edition: 'original',
    blurb: 'A rat standing up into a shaft of acid green, whiskers first.',
    framingShipping: 'Unframed on stretched canvas, shipped flat and tracked.',
    story:
      'The only piece in the shop with a real narrative in it. The rat is built from magenta, violet and bone white worked wet into each other, so the fur has genuine volume, and then the entire silhouette is traced in electric cyan to lift it off the petrol-dark ground. The green spatter in the upper corner is the light it is reaching for. Its hands are the most carefully painted passage on the canvas.',
    alt: 'Acrylic painting of a magenta rat standing upright with cyan-traced fur, reaching toward green light on a dark teal ground.',
  },
  {
    file: 'green-room.webp',
    title: 'Green Room',
    year: 2023,
    series: 'Low Company',
    medium: 'Acrylic on stretched canvas',
    heightIn: 8,
    widthIn: 8,
    priceCents: 60000,
    availability: 'sold',
    edition: 'original',
    blurb: 'Blue-green creature, molten spiral eyes, one forked tongue out.',
    framingShipping: 'Unframed on stretched canvas, shipped flat and tracked.',
    story:
      'An invented animal painted with real anatomy: the brow ridge, the jaw and the roll of the throat all behave like a body, which is what makes the color so disorienting. The eyes are concentric bands of orange into yellow, laid down in one continuous spiral each. Flat lime ground, no modeling, so the creature has nowhere to hide.',
    alt: 'Acrylic painting of an invented blue-green creature with orange spiral eyes and a forked red tongue, on a flat lime ground.',
  },
];

async function main(): Promise<void> {
  const existing = await listPaintings();
  const takenSlugs = new Set(existing.map((painting) => painting.slug));

  for (const entry of PAINTINGS) {
    const { file, alt, ...input } = entry;
    const slug = file.replace(/\.webp$/, '');
    if (takenSlugs.has(slug)) {
      console.log(`skip  ${entry.title} (already present)`);
      continue;
    }

    const painting = await createPainting({ ...input, printsAvailable: false, driveFolder: '', notes: '' });
    const bytes = await readFile(path.join(root, 'public/store', file));
    const photo = await addPhoto(painting.id, { buffer: bytes });
    await updatePhotoAlt(painting.id, photo.id, alt);
    console.log(`seed  ${entry.title} -> /store/${painting.slug}`);
  }

  console.log(`\nCatalog now holds ${(await listPaintings()).length} paintings.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
