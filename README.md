# Storefront

A fashion e-commerce platform: Next.js 16 (App Router) + TypeScript + Tailwind,
PostgreSQL via Drizzle, three languages (EN / EL / RU).

Brand name, address and legal details live in **`src/config/brand.ts`** — it is
currently a placeholder (`ATELIER`, `TODO` company details) and is the one file
to edit when the real name is decided.

## Running it

You need a PostgreSQL. If you have one, put its URL in `.env.local`. If you do
not, and would rather not install one, the project ships with an embedded
PostgreSQL that runs from `node_modules`:

```bash
npm install
npm run db:local                  # terminal 1 — leave it running
```

It prints the two lines to put in `.env.local`. Then, in a second terminal:

```bash
npm run db:check                  # confirms the connection before anything else
npm run db:push                   # schema + CHECK constraints + indexes
npm run db:seed                   # 20 categories, 12 products, 80 variants
npm run dev                       # http://localhost:3000
```

`db:local` is real PostgreSQL 18 compiled to WebAssembly (PGlite), speaking the
normal wire protocol on a TCP port — the application cannot tell the difference
and needs no changes. Its one limit is that queries are serialised through a
single engine, so set `DATABASE_POOL_MAX=1` and do not use it to judge the
concurrency behaviour; the reservation tests want a real server. Its data lives
in `./.localdb`.

When `db:check` says the database is ready and `npm run dev` still misbehaves,
the problem is the app, not the setup — that is the point of the check.

The seed prints its logins. It also deliberately includes a sold-out size, a
nearly sold-out size, a manual sale price, an active category promotion and two
promo codes (one expired) — every state the UI has to handle.

## Verifying it

```bash
npm test          # 141 unit/integration tests against a real Postgres
npm run check     # 77 checks against a running dev server, over HTTP
npm run lint
npm run build
```

`npm test` needs a **separate** database — `.env.test.local` with a
`DATABASE_URL` pointing at e.g. `storefront_test`. The tests truncate tables, so
pointing them at the dev database wipes your seed data.

The three HTTP checks are the ones worth reading:

| Script | What it proves |
| --- | --- |
| `check:concurrency` | Two — then ten — visitors race for the last unit. Exactly one wins, the losers get a readable 409, nothing is ever oversold. |
| `check:promo` | A promo code is validated, priced and stored server-side; a forged discount in the request body is ignored; refusals explain themselves. |
| `check:views` | Views are counted per person (a refresh does not inflate them), and nobody can read anyone else's history. |
| `check:auth` | No account exists until the emailed code is verified; duplicate email or phone refused; a wrong password and an unknown address are indistinguishable; the guest bag follows the customer into their account. |

`npm run db:check` is the one to reach for first when something will not start:
it walks configuration → connection → schema → data and stops at the first
broken link with the fix, and prints no password, so its output is safe to
share.

## The parts that carry the design decisions

| File | Why it matters |
| --- | --- |
| `src/lib/inventory.ts` | Reservations. One transaction, `SELECT … FOR UPDATE` in a deterministic order, `available = on_hand - reserved` as a generated column. Stock cannot go negative, and an abandoned cart releases its hold inline rather than waiting for a sweep job. |
| `src/db/constraints.sql` | 25 CHECK constraints the ORM cannot express, including the ones that make overselling impossible at the database level, plus order-total consistency. |
| `src/lib/pricing.ts` | The single source of truth for money. A manual sale price and a promotion never stack; a promo code applies after product discounts and never to delivery; VAT is extracted from a VAT-inclusive gross. |
| `src/lib/auth/otp.ts` | Registration OTP. An unverified signup creates no user at all, and the attempt counter is committed before the rejection is thrown. |
| `src/lib/db-errors.ts` | Unwraps driver errors so a unique-violation is identified by constraint name rather than by substring-matching a message. |
| `src/lib/sizes.ts` | Sizes sort as XS→XXL, not alphabetically. Every list of sizes goes through it. |
| `public/products/` | Product imagery. `npm run art` draws each garment — a hoodie with a hood, a slip dress with a bias hem — and **never overwrites a photograph**: drop `<slug>.jpg` in here, re-run `npm run art && npm run db:seed`, and the photo is used instead. That is the upgrade path from placeholder to real photography, with no code change. |
| `src/components/ProductMarquee.tsx` | The moving strip on the homepage. The list is rendered twice and the track travels exactly half its width, so the loop is seamless; one CSS animation, no per-frame JavaScript. Pauses on hover and on keyboard focus, and does not animate at all under `prefers-reduced-motion`. |
| `src/i18n/messages.ts` | All UI copy, with plural forms selected by `Intl.PluralRules` — Greek "1 προϊόν", Russian one/few/many. |

## Where it stands

Built and verified: catalogue, navigation from the database, listing with SQL
filtering/sorting/facets, search (full-text + trigram, all three languages),
product pages with Product JSON-LD, cart with atomic stock reservation, promo
codes, promotions, product views feeding "most viewed" and "recently viewed",
localisation and locale negotiation.

Registration with email verification, sign-in, sign-out and a basic account
page are built and verified. Still to come: Stripe checkout and webhooks, orders and
order tracking, transactional email, customer accounts, the admin panel, then
the SEO/performance/security passes.
