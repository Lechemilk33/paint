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

Payments are optional. Set these two as well and the store can take cards;
leave them unset and it behaves exactly as it did before - no Buy button, and
every piece takes email inquiries.

| Variable | What it is |
|---|---|
| `STRIPE_SECRET_KEY` | From dashboard.stripe.com/apikeys. |
| `STRIPE_WEBHOOK_SECRET` | From the webhook endpoint described under Payments below. |

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
  api/stripe/webhook/ # Stripe's report of what was actually paid
  globals.css         # every design token, including the .storefront palette
proxy.ts              # the gate on /admin (Next 16's middleware convention)
lib/
  paintings/
    schema.ts         # zod schemas, labels, and the domain helpers
    repository.ts     # ALL reads and writes. Swap this to move off blobs.
    public.ts         # the catalog as the public site sees it
  orders/
    holds.ts          # checkout reservations - why a piece cannot sell twice
    repository.ts     # the order ledger
  auth/               # scrypt hashing, signed session cookies
  stripe/client.ts    # the Stripe client, and whether Stripe is set up at all
  storage/blobs.ts    # Netlify Blobs, with a filesystem fallback for local work
features/
  storefront/         # public components
  admin/              # server actions and admin components
scripts/              # seed, credentials, paycheck
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

## Payments

Cards are taken through Stripe Checkout. Stripe hosts the payment page; this
app never sees a card number, and the catalog stays the only source of truth
for what a painting is and what it costs.

Checkout is **off for every piece by default**, including pieces already in the
catalog. To sell one, open it in the admin, check the price and the shipping,
then tick "Let people buy this outright". Everything else keeps taking
inquiries, which is the right default for work that needs a conversation or a
freight quote first.

To set it up:

1. Put `STRIPE_SECRET_KEY` on the site (test key first).
2. Add an endpoint at dashboard.stripe.com/webhooks pointing at
   `https://your-site/api/stripe/webhook`, subscribed to
   `checkout.session.completed`, `checkout.session.expired`,
   `checkout.session.async_payment_succeeded` and
   `checkout.session.async_payment_failed`.
3. Put its signing secret on the site as `STRIPE_WEBHOOK_SECRET`.

Locally, `stripe listen --forward-to localhost:3000/api/stripe/webhook` gives
you a signing secret for `.env.local` and forwards real test events to it.

Paid orders land at `/admin/orders`, with the shipping address and a link into
the Stripe dashboard.

### Selling one canvas twice

The one failure worth designing against: two people with the same painting
open, both clicking Buy. Before anyone reaches Stripe the painting's key is
claimed in the `holds` store with an atomic create, so exactly one of them
wins and the other is sent to the inquiry form. The hold expires with the
Checkout Session that owns it - thirty minutes - so an abandoned checkout
never takes a piece off sale for good.

The hold is the guard, not the record. What marks a painting sold is the
webhook, after Stripe confirms the money, because someone who pays and closes
the tab has still paid. Marking a piece sold records which checkout did it, so
a redelivered webhook is recognised as that same payment - without that, a
retry would book a perfectly good sale as one needing a refund. If a second
payment ever does land on a sold piece, the order is written down as
`needs_refund` and flagged in the admin rather than quietly overwriting the
first.

`npm run paycheck` exercises all of this against the local store: ten
simultaneous claims on one canvas, a redelivered webhook, a second buyer, and
a piece deleted mid-checkout. It refuses to run against Netlify Blobs, since
it writes to the catalog.

**Known limit:** starting a checkout is a public action, so someone determined
could take a hold on every piece and renew it, keeping the store unsellable in
35-minute windows. It costs them nothing and it takes no payment, so it is
vandalism rather than fraud - but there is no rate limiting on that path today.
Per-IP throttling on `startCheckoutAction` is where to add it.

## Notes

- Paintings are one-of-a-kind, so the cart holds an item or does not, rather
  than carrying a quantity. It persists to `localStorage`.
- Every piece takes email inquiries. A piece can additionally be switched on
  for card checkout in the admin - see Payments below.
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
