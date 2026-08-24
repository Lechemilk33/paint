# Voltage Reef — storefront

A storefront for original psychedelic realism paintings. Next.js, Tailwind v4,
shadcn/ui primitives.

There is no server, no database, and no environment variable anywhere in this
app. `npm run build` prerenders every page and writes plain HTML/CSS/JS to
`out/`, which any static host will serve. It is live at
<https://voltage-reef-studio.netlify.app>.

## Run it

```sh
npm install
npm run dev          # http://localhost:3000
```

To check what a host actually serves, rather than the dev server:

```sh
npm run build        # writes out/
npm run preview      # serves out/ on http://localhost:3000
```

## Deploy

`netlify.toml` holds the whole configuration — build command, publish
directory, Node version, and a redirect from `/` to `/store/`.

**Connect the repo (deploys on every push):** app.netlify.com → Add new site →
Import an existing project → GitHub → this repo. Netlify reads `netlify.toml`,
so leave the build settings alone.

**Or push a build straight up:**

```sh
npm run build
npx netlify-cli deploy --prod --dir=out
```

`out/` is just files, so nothing ties this to Netlify — Cloudflare Pages
(build `npm run build`, output `out`), GitHub Pages, or S3 all work. Only
Netlify reads `netlify.toml`, so elsewhere the bare `/` falls back to the meta
refresh in `app/page.tsx`, which lands in the same place.

## Layout

```
app/
  store/            # the storefront routes: home, [slug] detail, loading, error
  layout.tsx        # root shell
  page.tsx          # / bounces to /store/
  globals.css       # every design token, including the .storefront palette
components/ui/      # shadcn primitives (button, badge, sheet, skeleton)
features/storefront/
  catalog.ts        # THE PAINTINGS - titles, prices, sizes, availability
  schema.ts         # zod schemas + inferred types
  queries.ts        # query key factory + queryOptions
  format.ts         # price and dimension formatting
  components/       # hero, grid, cards, detail, filters, cart, header, footer
public/store/       # the painting images
```

## Editing the content

- **`features/storefront/catalog.ts`** is the file you will actually edit. It
  holds every painting plus the studio name and contact address at the top.
  **Prices, dimensions, years and availability are placeholders** and need real
  values before anyone buys anything. The studio name "Voltage Reef" and the
  address `hello@voltagereef.example` are placeholders too.
- **`public/store/*.webp`** — the images. Add a painting by dropping a file here
  and adding its catalog entry; nothing else changes.
- **`app/globals.css`** — the `.storefront` block holds the neon palette. Every
  component reads those tokens, so recolouring the whole site is one edit there.

## Notes

- Paintings are one-of-a-kind, so the cart holds an item or does not, rather
  than carrying a quantity. It persists to `localStorage`.
- There is no checkout and no payment path. The flow ends at an email enquiry.
- `next/image`'s optimizer needs a server, so images are `unoptimized` and the
  WebP files are served exactly as they sit in `public/`.
- Originally built inside a monorepo and extracted; the git history before the
  first commit here lives in that repo.
