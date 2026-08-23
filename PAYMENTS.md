# Payments — setup and go-live

Card payments run through **Viva.com** (formerly Viva Wallet) Smart Checkout,
with the API on **Vercel serverless functions**. Cash-on-delivery and
reserve-in-shop need no payment provider at all.

Nothing in this repository contains a credential, and nothing should. Every
secret is read from an environment variable that **you** set — see
`.env.example`.

---

## How a payment actually flows

```
browser                    our API (/api)                  Viva.com
   │                             │                             │
   │  POST /api/checkout ───────►│                             │
   │  { lines, fulfilment,       │ 1. re-price the basket      │
   │    customer }               │    from src/lib/pricing.js  │
   │                             │ 2. validate the customer    │
   │                             │ 3. save order = pending     │
   │                             │ 4. POST /connect/token ────►│
   │                             │ 5. POST /checkout/v2/orders►│
   │                             │◄──── orderCode ─────────────│
   │◄── { redirectUrl } ─────────│                             │
   │                                                           │
   │  ── customer redirected to Viva's hosted page ───────────►│
   │                                          (card / Apple Pay / Google Pay)
   │                                                           │
   │◄── redirect to /api/return?t=<transactionId> ─────────────│
   │                             │                             │
   │                             │ 6. GET /checkout/v2/         │
   │                             │    transactions/<t> ───────►│
   │                             │◄─── statusId + amount ──────│
   │                             │ 7. amount matches? → paid   │
   │◄── 302 to /#/order/FM-XXXX ─│                             │
                                 │◄── POST /api/webhook ───────│ (belt and braces)
```

Two properties matter and are both tested in `scripts/test-checkout.mjs`:

1. **The browser never sends a price.** It sends product ids and quantities.
   The server prices the basket from `src/lib/pricing.js` — the same module the
   UI imports, so the figures always agree, but the server's copy is the only
   one that reaches Viva. Editing prices in devtools changes nothing.
2. **An order is only marked paid after asking Viva directly.** Neither the
   return URL's query string nor the webhook body is trusted; both are used
   only to learn a transaction id, which is then verified against Viva's API
   and checked against the amount we recorded. A forged webhook cannot mark an
   order paid — there's a test for exactly that.

---

## Running it locally

```bash
npm install
cp .env.example .env.local     # then fill in the Viva values
npm run dev                    # Vite on :5173 + API on :3001
```

`npm run dev` starts both. Vite proxies `/api/*` to the API process, so
`http://localhost:5173` behaves exactly like the deployed site.

Without any Viva credentials the site still runs: cash-on-delivery and
reserve-in-shop work end to end, and card checkout returns a clean
"payment provider unavailable" error instead of crashing.

Run the checks any time:

```bash
npm run test:checkout          # 45 assertions, needs the API running
```

---

## Getting the credentials

Everything below happens in the **Viva banking app**, signed in as the
merchant. Do the demo environment first and leave it that way until the
go-live checklist is complete.

| Environment | Sign in at |
| --- | --- |
| Demo / sandbox | `demo.vivapayments.com` |
| Live | `www.vivapayments.com` |

Demo and live credentials are **not interchangeable** — a demo client id will
simply 401 against the live API.

### 1. Smart Checkout credentials → `VIVA_CLIENT_ID`, `VIVA_CLIENT_SECRET`

Settings → API access → Smart Checkout credentials. Generate a pair. The
secret is shown once; if you lose it, generate another.

These grant the scope `urn:viva:payments:core:api:redirectcheckout` — enough to
create payment orders and read transactions, and nothing else. That is
deliberately the least privilege this integration needs.

### 2. Payment source → `VIVA_SOURCE_CODE`

Sales → Payment sources → add a source of type **Website**. Set:

| Field | Value |
| --- | --- |
| Success URL | `https://YOUR-DOMAIN/api/return` |
| Failure URL | `https://YOUR-DOMAIN/api/return` |

Both point at the same endpoint on purpose — it works out what happened by
asking Viva, not by which URL it was called on.

Copy the 4-digit source code into `VIVA_SOURCE_CODE`. In demo, `Default` works.

> These URLs live on the payment source, not in the API call. If they are wrong,
> the customer pays and then lands nowhere. Check them first when debugging.

### 3. Merchant credentials → `VIVA_MERCHANT_ID`, `VIVA_API_KEY`

Settings → API access. Needed **only** so `/api/webhook` can answer Viva's
verification handshake. Card payments work without them; you just won't have
the webhook safety net.

### 4. Webhook

Settings → API access → Webhooks. Add:

```
https://YOUR-DOMAIN/api/webhook
```

Click **Verify**. Viva sends a `GET`, our endpoint fetches the key from Viva
using the merchant credentials and echoes it back as `{"Key": "..."}`.
Subscribe to:

- **Transaction Payment Created** (`1796`)
- **Transaction Failed** (`1798`)

Why bother, when `/api/return` already verifies? Because the customer can close
the tab on Viva's page after paying and never hit the return URL. The webhook is
what stops that becoming a paid-but-unrecorded order.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Vercel → Add New → Project → import it. The settings in `vercel.json` are
   picked up automatically (Vite build, `dist` output, Node 22 functions).
3. Add the environment variables from `.env.example` under
   Settings → Environment Variables. **Set them for Production, Preview and
   Development separately** — and keep `VIVA_ENV=demo` on Preview forever, so a
   preview deployment can never take a real payment.
4. Set `PUBLIC_SITE_URL` to the real domain once it's attached.
5. Redeploy after changing any variable — functions read them at cold start.

### Durable orders (strongly recommended before live)

Without `KV_REST_API_URL` / `KV_REST_API_TOKEN`, orders live in the memory of a
serverless instance and vanish when it recycles. The payment is still safe in
Viva, but the customer's confirmation page can 404.

Vercel → Storage → add **Upstash Redis**. It sets both variables for you. No
code change needed; `api/_lib/store.js` picks them up.

### Order emails (needed before COD or reserve-in-shop go live)

Card customers get a receipt from Viva automatically. For cash-on-delivery and
reserve-in-shop, an email to the shop is the **only** thing that tells anyone an
order exists. Set `RESEND_API_KEY` and `SHOP_ORDER_EMAIL`, and verify the
sending domain with Resend or the mail will land in spam.

---

## Testing a real card flow in sandbox

With demo credentials set, place a card order and pay with:

| Card | Outcome |
| --- | --- |
| `4147 4630 1111 0133` | Visa, succeeds |
| `5239 2907 0000 0119` | Mastercard, fails |
| `5188 3400 0000 0060` | triggers the 3-D Secure challenge screen |

Any future expiry, any CVV. Charging **€99.06** simulates a general error.

Verify all four of these before believing it works:

- [ ] Successful card payment lands on `/#/order/FM-XXXXXX` showing **Paid**
- [ ] Declined card lands on the same page showing **Payment did not go through**
- [ ] Pressing browser-back on Viva's page leaves the order **cancelled**, not paid
- [ ] Closing the tab straight after paying still ends up **paid** (that's the webhook)

---

## Go-live checklist

Do not flip `VIVA_ENV=production` until every line is ticked.

**Viva account**
- [ ] Merchant account approved and able to accept card payments
- [ ] Live Smart Checkout credentials generated and set in Vercel Production
- [ ] Live payment source created, Success/Failure URLs pointing at the real domain
- [ ] Live webhook added and verified
- [ ] Apple Pay: domain registered in the Viva banking app (it will not appear otherwise)
- [ ] Payout bank account confirmed

**Infrastructure**
- [ ] Upstash Redis attached, so orders survive
- [ ] `RESEND_API_KEY` set and the sending domain verified
- [ ] `PUBLIC_SITE_URL` set to the live domain
- [ ] `VIVA_ENV=demo` still set on the Preview environment
- [ ] One full live test purchase of a cheap item, then refunded from the Viva app

**Legal — this is the part that gets forgotten**
- [ ] Terms of sale, refund/returns policy, privacy policy and cookie notice
      written for real (the footer links are placeholders pointing at /contact)
- [ ] Cyprus consumer right of withdrawal (14 days) reflected in the returns policy
- [ ] VAT rate confirmed by his accountant — see below
- [ ] Company name, registration number and VAT number in the footer
- [ ] Delivery timescales and charges stated before payment, not after

---

## The VAT question

`src/lib/pricing.js` sets `VAT_RATE = 0.19` — the Cyprus standard rate — and
treats displayed prices as **VAT-inclusive**, which EU consumer law requires.
VAT is therefore *extracted* from the total rather than added on top:
`vat = total − total ÷ 1.19`.

Whether food supplements are standard-rated at 19% or fall under a reduced rate
depends on how each product is classified, and that is a question for his
accountant, not for a developer. 19% is the safe default — over-declaring can be
corrected, under-declaring is a penalty. If the answer differs, change the one
constant and everything downstream follows.

The invoice numbering, VAT reporting and accounting integration this shop will
eventually need are **not** built. Viva's dashboard is the record of every
transaction in the meantime.

---

## What is deliberately not built

Be straight with him about this list rather than letting him assume otherwise:

- **Real stock control.** `stock` is a static number in `catalog.js`. Two people
  can buy the last tub at the same time. A real shop needs the catalogue in a
  database with stock decremented inside the payment transaction.
- **Refunds.** Issued from the Viva banking app. No admin UI here.
- **Customer accounts, order history, wishlists.** The current site has them.
- **An admin order screen.** Orders arrive by email; the shop works from that.
- **Discount codes, loyalty, abandoned-cart email.**
- **Invoice PDFs.**

None of that blocks a first launch, but the first three are what he will ask
about within a month — worth quoting as phase two rather than discovering later.

---

## Sources

- [Smart Checkout integration](https://developer.viva.com/smart-checkout/smart-checkout-integration/)
- [OAuth 2.0 authentication](https://developer.viva.com/integration-reference/oauth2-authentication/)
- [Create a payment order](https://developer.viva.com/tutorials/payments/create-a-payment-order/)
- [Retrieve transaction](https://developer.viva.com/code-samples-for-payments/retrieve-transaction/)
- [Setting up webhooks](https://developer.viva.com/webhooks-for-payments/setting-up-webhooks/)
- [Transaction Payment Created (1796)](https://developer.viva.com/webhooks-for-payments/transaction-payment-created/)
- [Test cards and environments](https://developer.viva.com/integration-reference/test-cards-and-environments/)
- [Cyprus VAT rates](https://taxsummaries.pwc.com/cyprus/corporate/other-taxes)
