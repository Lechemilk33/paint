# Voltage Reef — storefront

A storefront for original psychedelic realism paintings. Next.js, Tailwind v4,
shadcn/ui primitives.

The catalog lives in Netlify Blobs and is edited through a password-protected
admin at `/admin`. Photos are uploaded there too, several per painting, and
served back out of blob storage. Live at
<https://voltage-reef-studio.netlify.app>.

## Run it

```sh
npm install
cp .env.example .env.local
npm run credentials   # prints a password, its hash, and a session secret
#   paste the hash and secret into .env.local, keep the password
npm run seed          # optional: loads the five launch paintings
npm run dev           # http://localhost:3000
```

Off Netlify there is no blob service, so storage falls back to a folder at
`.netlify/local-blobs`. That is what `npm run dev` and `npm run seed` read and
write, and it is gitignored.

```sh
npm run build && npm start   # the real production server, on :3000
npm run typecheck
```

## Deploy

This is a server-rendered app now, not a folder of files, so it needs a host
that runs Next.js. `netlify.toml` holds the build configuration.

**Connect the repo (deploys on every push):** app.netlify.com → Add new site →
Import an existing project → GitHub → this repo. Netlify reads `netlify.toml`,
so leave the build settings alone.

Two environment variables must be set on the site, from `npm run credentials`:

| Variable | What it is |
|---|---|
| `ADMIN_PASSWORD_HASH` | scrypt hash of the admin password. The password itself is never stored. |
| `AUTH_SECRET` | Signing key for the admin session cookie, 32+ random characters. |

Netlify Blobs needs no configuration - it is injected at runtime. That also
means the store is per-site: a deploy preview and production do not share a
catalog.

To change the admin password, run `npm run credentials` again and replace both
variables. Every signed-in session is invalidated when `AUTH_SECRET` changes.

## Layout

```
app/
  store/              # the public storefront
    (catalog)/        # the index, in a group so its loading skeleton does not
                      #   wrap the detail route - a Suspense boundary there
                      #   would force a 200 on a missing painting
    [slug]/           # one painting
  admin/              # the studio, behind the password
    paintings/new     #   create
    paintings/[id]    #   edit, photos, delete
  api/photos/[id]/    # serves photo bytes out of blob storage
  globals.css         # every design token, including the .storefront palette
proxy.ts              # the gate on /admin (Next 16's middleware convention)
lib/
  paintings/
    schema.ts         # zod schemas, labels, and the domain helpers
    repository.ts     # ALL reads and writes. Swap this to move off blobs.
    public.ts         # the catalog as the public site sees it
  auth/               # scrypt hashing, signed session cookies
  storage/blobs.ts    # Netlify Blobs, with a filesystem fallback for local work
features/
  storefront/         # public components
  admin/              # server actions and admin components
scripts/              # seed, credentials
```

## Editing the content

Paintings are edited at `/admin`, not in code. What is still hardcoded:

- **`features/storefront/studio.ts`** — the studio name and contact address.
  Both are placeholders: "Voltage Reef" and `hello@voltagereef.example`.
- **`app/globals.css`** — the `.storefront` block holds the neon palette. Every
  component reads those tokens, so recolouring the whole site is one edit there.
- The five seeded paintings carry **placeholder prices, sizes and years**.
  Correct them in the admin.

A painting with no photo is hidden from the public store; the admin says so
when one is created.

## Notes

- Paintings are one-of-a-kind, so the cart holds an item or does not, rather
  than carrying a quantity. It persists to `localStorage`.
- There is no checkout and no payment path. The flow ends at an email enquiry.
- Uploads are rotated upright from EXIF, bounded to 2000px and re-encoded to
  WebP on the way in, so the bytes in storage are the bytes served and no
  request-time image pipeline is needed.
- The whole catalog is one JSON blob. That is a deliberate trade for a catalog
  of this size - see the comment at the top of `lib/paintings/repository.ts`
  for when it stops being the right one.
- There is one shared admin password and no user accounts. Adding a second
  person means adding a real user store.
- Originally built inside a monorepo and extracted; the git history before the
  first commit here lives in that repo.
