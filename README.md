# Storefront

A fashion e-commerce platform: Next.js 16 (App Router) + TypeScript + Tailwind,
PostgreSQL via Drizzle, three languages (EN / EL / RU).

Brand name, address and legal details live in **`src/config/brand.ts`** — it is
currently a placeholder (`ATELIER`, `TODO` company details) and is the one file
to edit when the real name is decided.

## Running it

```bash
cp .env.example .env.local        # then fill DATABASE_URL
npm install
npm run db:push                   # schema + CHECK constraints + indexes
npm run db:seed                   # 20 categories, 12 products, 80 variants
npm run dev                       # http://localhost:3000
```

The seed prints its logins. It also deliberately includes a sold-out size, a
nearly sold-out size, a manual sale price, an active category promotion and two
promo codes (one expired) — every state the UI has to handle.

## Verifying it

```bash
npm test          # 141 unit/integration tests against a real Postgres
npm run check     # 46 checks against a running dev server, over HTTP
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

## The parts that carry the design decisions

| File | Why it matters |
| --- | --- |
| `src/lib/inventory.ts` | Reservations. One transaction, `SELECT … FOR UPDATE` in a deterministic order, `available = on_hand - reserved` as a generated column. Stock cannot go negative, and an abandoned cart releases its hold inline rather than waiting for a sweep job. |
| `src/db/constraints.sql` | 25 CHECK constraints the ORM cannot express, including the ones that make overselling impossible at the database level, plus order-total consistency. |
| `src/lib/pricing.ts` | The single source of truth for money. A manual sale price and a promotion never stack; a promo code applies after product discounts and never to delivery; VAT is extracted from a VAT-inclusive gross. |
| `src/lib/auth/otp.ts` | Registration OTP. An unverified signup creates no user at all, and the attempt counter is committed before the rejection is thrown. |
| `src/lib/db-errors.ts` | Unwraps driver errors so a unique-violation is identified by constraint name rather than by substring-matching a message. |
| `src/lib/sizes.ts` | Sizes sort as XS→XXL, not alphabetically. Every list of sizes goes through it. |
| `src/i18n/messages.ts` | All UI copy, with plural forms selected by `Intl.PluralRules` — Greek "1 προϊόν", Russian one/few/many. |

## Where it stands

Built and verified: catalogue, navigation from the database, listing with SQL
filtering/sorting/facets, search (full-text + trigram, all three languages),
product pages with Product JSON-LD, cart with atomic stock reservation, promo
codes, promotions, product views feeding "most viewed" and "recently viewed",
localisation and locale negotiation.

Registration/OTP/session logic and its tests exist; the sign-in and account
**pages** do not yet. Still to come: Stripe checkout and webhooks, orders and
order tracking, transactional email, customer accounts, the admin panel, then
the SEO/performance/security passes.
