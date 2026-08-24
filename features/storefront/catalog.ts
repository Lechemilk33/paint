import { paintingSchema, seriesSchema, type Painting, type Series } from './schema';

/**
 * Store identity. Single source for the wordmark and the contact handoff, so
 * renaming the shop is a one-line change.
 *
 * PLACEHOLDER: `contactEmail` deliberately uses the reserved `.example` domain
 * so nothing can be sent to a real inbox by accident. Swap it for the studio's
 * real address before this goes live.
 */
export const STUDIO = {
  name: 'Voltage Reef',
  tagline: 'Psychedelic realism, painted on small canvas',
  contactEmail: 'hello@voltagereef.example',
} as const;

/**
 * Curatorial groupings. These drive the catalog filter, nothing structural, so
 * a piece can be re-filed by editing one field on the painting.
 */
const SERIES_DATA: Series[] = [
  {
    id: 'puffer-cycle',
    name: 'The Puffer Cycle',
    blurb: 'Pufferfish caught mid-inflation, every spine drawn as a bolt of light.',
  },
  {
    id: 'night-fauna',
    name: 'Night Fauna',
    blurb: 'Animals most people step around, painted at full voltage.',
  },
  {
    id: 'low-company',
    name: 'Low Company',
    blurb: 'Invented creatures with real anatomy and impossible color.',
  },
];

/**
 * The catalog.
 *
 * PLACEHOLDER DATA: prices, canvas dimensions, years, and availability are
 * stand-ins so the storefront has something honest-shaped to render. Replace
 * them with the studio's real figures. The images are the actual paintings.
 *
 * Held in-module rather than in Postgres on purpose: a five-piece catalog does
 * not need a table, and `fetchPaintings` below is the single seam to swap for a
 * Supabase query when it does.
 */
const PAINTINGS_DATA: Painting[] = [
  {
    id: 'ptg-deep-voltage',
    slug: 'deep-voltage',
    title: 'Deep Voltage',
    year: 2024,
    seriesId: 'puffer-cycle',
    medium: 'Acrylic on stretched canvas',
    widthIn: 10,
    heightIn: 10,
    priceCents: 68000,
    status: 'available',
    blurb: 'Cobalt and magenta puffer, spines thrown wide against a tie-dyed current.',
    story:
      'The ground was laid in first as a wet-on-wet swirl of viridian, cobalt and chartreuse, then the fish was cut back into it in opaque strokes. Every spine is a single unbroken pull of the brush, which is why they taper the way real ones do. The eyes carry two different worlds: one is a cool blue vortex, the other a coiled band of amber, and the white catchlights are the last two marks made on the canvas.',
    image: {
      src: '/store/deep-voltage.webp',
      width: 1169,
      height: 1174,
      alt: 'Acrylic painting of a pufferfish in cobalt and magenta with long cyan spines, on a swirled blue and green ground.',
    },
  },
  {
    id: 'ptg-acid-grin',
    slug: 'acid-grin',
    title: 'Acid Grin',
    year: 2024,
    seriesId: 'puffer-cycle',
    medium: 'Acrylic and ink on stretched canvas',
    widthIn: 8,
    heightIn: 10,
    priceCents: 54000,
    status: 'available',
    blurb: 'Chartreuse puffer, black zigzag contour, and a mouth that knows something.',
    story:
      'Painted in near-fluorescent yellow-green over a flat cobalt field, then outlined entirely in black ink while the acrylic was still cold. The contour is drawn as a zigzag rather than a smooth line, so the silhouette buzzes at the edges. Flicked ink spatter across the lower ground was left exactly where it landed.',
    image: {
      src: '/store/acid-grin.webp',
      width: 1169,
      height: 1356,
      alt: 'Acrylic painting of a grinning chartreuse pufferfish outlined in black ink on a deep blue spattered ground.',
    },
  },
  {
    id: 'ptg-bubblegum-pressure',
    slug: 'bubblegum-pressure',
    title: 'Bubblegum Pressure',
    year: 2025,
    seriesId: 'puffer-cycle',
    medium: 'Acrylic on stretched canvas',
    widthIn: 8,
    heightIn: 8,
    priceCents: 52000,
    status: 'reserved',
    blurb: 'Pink under pressure, yellow-eyed, with two spiral bubbles for company.',
    story:
      'The most frontal of the puffers: the fish sits dead center and the whole cyan ground is raked outward from it in short vertical strokes, so the background reads as pressure rather than water. Spines run from carmine through magenta to near-black. The two spiral bubbles in the lower right were added last, the only marks on the canvas that curl instead of point.',
    image: {
      src: '/store/bubblegum-pressure.webp',
      width: 1169,
      height: 1110,
      alt: 'Acrylic painting of a pink pufferfish with yellow eyes and magenta spines on a cyan ground, with two spiral bubbles.',
    },
  },
  {
    id: 'ptg-nightshift',
    slug: 'nightshift',
    title: 'Nightshift',
    year: 2025,
    seriesId: 'night-fauna',
    medium: 'Acrylic on stretched canvas',
    widthIn: 9,
    heightIn: 12,
    priceCents: 96000,
    status: 'available',
    blurb: 'A rat standing up into a shaft of acid green, whiskers first.',
    story:
      'The only piece in the shop with a real narrative in it. The rat is built from magenta, violet and bone white worked wet into each other, so the fur has genuine volume, and then the entire silhouette is traced in electric cyan to lift it off the petrol-dark ground. The green spatter in the upper corner is the light it is reaching for. Its hands are the most carefully painted passage on the canvas.',
    image: {
      src: '/store/nightshift.webp',
      width: 1169,
      height: 1533,
      alt: 'Acrylic painting of a magenta rat standing upright outlined in cyan, on a dark teal ground with green spatter above.',
    },
  },
  {
    id: 'ptg-green-room',
    slug: 'green-room',
    title: 'Green Room',
    year: 2023,
    seriesId: 'low-company',
    medium: 'Acrylic on stretched canvas',
    widthIn: 8,
    heightIn: 8,
    priceCents: 60000,
    status: 'sold',
    blurb: 'Blue-green creature, molten spiral eyes, one forked tongue out.',
    story:
      'An invented animal painted with real anatomy: the brow ridge, the jaw and the roll of the throat all behave like a body, which is what makes the color so disorienting. The eyes are concentric bands of orange into yellow, laid down in one continuous spiral each. Flat lime ground, no modeling, so the creature has nowhere to hide.',
    image: {
      src: '/store/green-room.webp',
      width: 1169,
      height: 1179,
      alt: 'Acrylic painting of a blue-green creature with orange spiral eyes and a forked red tongue on a flat lime ground.',
    },
  },
];

/** Parsed once at module load, so malformed catalog data fails loudly at boot. */
const SERIES = seriesSchema.array().parse(SERIES_DATA);
const PAINTINGS = paintingSchema.array().parse(PAINTINGS_DATA);

/**
 * The whole catalog, newest first. Async because it is the seam a real backend
 * slots into: everything downstream already awaits it.
 */
export async function fetchPaintings(): Promise<Painting[]> {
  return [...PAINTINGS].sort((a, b) => b.year - a.year);
}

/** One painting by its URL slug, or null so the route can render notFound(). */
export async function fetchPaintingBySlug(slug: string): Promise<Painting | null> {
  return PAINTINGS.find((painting) => painting.slug === slug) ?? null;
}

export async function fetchSeries(): Promise<Series[]> {
  return SERIES;
}

/** Every slug, for generateStaticParams on the detail route. */
export function paintingSlugs(): string[] {
  return PAINTINGS.map((painting) => painting.slug);
}

/** The piece the hero leads with. Named outright rather than derived, so
 *  changing the front of the shop is a one-word edit. Resolved at module load
 *  alongside the schema parse, so a typo here fails at boot, not on a request. */
const FEATURED_SLUG = 'deep-voltage';

function requirePainting(slug: string): Painting {
  const painting = PAINTINGS.find((entry) => entry.slug === slug);
  if (!painting) throw new Error(`Painting "${slug}" is not in the catalog`);
  return painting;
}

const FEATURED = requirePainting(FEATURED_SLUG);

export async function fetchFeaturedPainting(): Promise<Painting> {
  return FEATURED;
}

/** Headline counts for the hero: how much work there is, and how much is free. */
export async function fetchCatalogSummary(): Promise<{ total: number; available: number }> {
  return {
    total: PAINTINGS.length,
    available: PAINTINGS.filter((painting) => painting.status === 'available').length,
  };
}
