# What's left before this takes real money

An audit of the build as it stands — run against the working tree, not from
memory. Split into three gates. Gate 1 is genuinely blocking: skip any of it and
you either *can't* take an order or *shouldn't*.

Each item is marked **[YOU]**, **[DEV]** (I can do it) or **[BOTH]**.

Payment specifics are in [PAYMENTS.md](PAYMENTS.md). Pitch notes in
[README.md](README.md).

---

## Gate 1 — blocking. No real orders until all ten are done.

Two kinds of blocker are mixed here on purpose: things that make the shop
*technically unable* to take a payment, and things that make it *unlawful or
dishonest* to take one. They gate the launch equally.

**Start 1.1 today.** Merchant approval is the long pole and everything else
waits behind it.

### 1.1 Get the Viva.com merchant account approved — [YOU] · days of waiting

Apply at viva.com as the business. They'll want company registration documents,
ID for the directors, and the payout bank account. This is an underwriting
decision on their side, so it isn't same-day — which is exactly why it goes
first. Nothing else in Gate 1 can be finished until it clears.

### 1.2 Wire the live credentials and the return URLs — [YOU] · ~20 min

Live Smart Checkout credentials into the Vercel environment variables, then
create the Website payment source and set its Success **and** Failure URLs to
`https://your-domain/api/return`.

Get those URLs wrong and customers pay, then land on a blank page — it's the
most common failure in this whole integration. Exact click-path is in
PAYMENTS.md. Keep `VIVA_ENV=demo` everywhere until the rest of this gate closes.

### 1.3 Write the terms, returns and privacy policies — [YOU] · a week, mostly waiting

The footer links are placeholders pointing at the contact page. Selling to
consumers in Cyprus needs real terms of sale, a returns and refund policy, a
privacy notice, and — once you add analytics — a cookie notice. The returns
policy has to reflect the **14-day right of withdrawal** EU consumers have on
distance sales.

A template beats nothing, a lawyer beats a template, and this is the item people
put off until the week they launch.

### 1.4 Put the company and VAT numbers in the footer — [YOU] · 10 min

Registered company name, registration number, VAT number, trading address. An EU
online trader is required to show these, and their absence is the first thing a
suspicious customer notices. Send them over or edit `src/lib/shop.js`.

### 1.5 Confirm the VAT rate with his accountant — [YOU] · one phone call

The code assumes **19% standard, VAT-inclusive pricing** and extracts VAT out of
the displayed total. Whether food supplements sit at the standard rate or a
reduced one depends on how each product is classified — a question for his
accountant, not for me. If the answer differs it's one constant in
`src/lib/pricing.js` and everything downstream follows.

### 1.6 Deploy to Vercel on the real domain — [BOTH] · ~1 hour

Push to GitHub, import the repo into Vercel, add the environment variables,
point the `.com.cy` DNS at it.

Note Vercel's free Hobby tier is for non-commercial projects — check their
current terms and budget for the paid tier, since a shop taking money is
commercial use.

### 1.7 Attach durable order storage — [YOU] · 5 min

Vercel → Storage → Upstash Redis. It sets the two variables the code already
looks for, so there's no code change.

Skip it and orders live in the memory of a serverless instance: the payment is
still safe at Viva, but a customer who just paid can hit a "no such order" page.
Cheapest fix on this entire list.

### 1.8 Turn on order emails and verify the sending domain — [YOU] · ~30 min

Card customers get a receipt from Viva automatically. For **cash-on-delivery and
reserve-in-shop, the email to the shop is the only thing that tells anyone an
order exists** — without it those orders are invisible and the customer waits for
a box nobody packed.

Create a Resend account, verify the domain (unverified senders go to spam), set
`RESEND_API_KEY` and `SHOP_ORDER_EMAIL`.

### 1.9 Replace the `#/` routes with real URLs — [DEV] · 2–3 hours

Today a product lives at `/#/product/asl-isolate-90`. Everything after the `#`
is invisible to a server, so search engines can't treat product pages as
separate pages and none of them can rank — fatal for a shop that wants to be
found for "whey protein Larnaca".

I chose HashRouter so the demo runs by double-clicking a file; that trade-off
stops making sense the moment it's hosted. Needs BrowserRouter plus a rewrite
rule in `vercel.json`, which isn't there yet — without it, refreshing any deep
link 404s.

### 1.10 Make the contact and newsletter forms actually send — [DEV] · ~2 hours

Both currently say "Thanks — we will reply today" and then throw the message
away. It was honest in a demo and it is **indefensible on a live site**: a
customer asks a question, believes it was sent, and never hears back. Needs a
real endpoint behind each, reusing the mail setup from 1.8.

---

## Gate 2 — month one. These break, embarrass, or cost him money.

You could launch without these. You'll regret each one within about four weeks
of real traffic, and he'll ask about them in roughly this order.

### 2.1 Load the real catalogue — [BOTH] · depends on his data

There are **33 demo products against his 600-plus real ones**, and only seven
prices are genuinely his. Get his product list out of whatever he uses now — a
spreadsheet export is ideal, even a messy one — and I'll write the importer.
Until this is done the site can't go live in any honest form.

### 2.2 Get product photography — [YOU] · a day of shooting

Every product is currently a drawn SVG tub. It looks deliberate rather than
broken, which is why the demo holds up, but it's the biggest visual gap between
this and a real shop.

Two routes: shoot the shelves in the shop on a phone against a plain backdrop,
or ask each importer for their brand asset packs — most hand them over free. The
code already renders a photo the moment a product has an `image` field.

### 2.3 Build real stock control — [BOTH] · 1–2 days + a decision

Stock is a hard-coded number in a file today and nothing decrements it. Two
customers can buy the last tub in the same minute and both get charged. It also
means the shop floor and the website drift apart immediately.

Needs the catalogue in a database with stock decremented inside the payment
flow — so it needs a decision from you on where that database lives.

### 2.4 Build an admin screen for orders — [DEV] · 1–2 days

Orders arrive as email and that's the entire workflow — no way to see today's
list, mark one packed or shipped, or look up what a customer ordered last month.
Workable for the first week at low volume, painful by the second.

### 2.5 Fix search for Greek — [DEV] · ~1 hour

A real bug I found auditing this: search matches product names and the *English*
descriptions only. Flip the site to Ελληνικά, search "πρωτεΐνη", and you get
nothing back — on a bilingual shop in Cyprus that's half the audience hitting an
empty results page. Also wants accent-insensitive matching, since people type
without accents.

### 2.6 Add the SEO basics — [DEV] · half a day

There's one title tag for the whole site, no per-page descriptions, no Open
Graph tags, no `sitemap.xml`, no `robots.txt`, and no Product structured data. So
every page shares one Google result, and a link shared on WhatsApp or Instagram
shows no preview card.

Only worth doing after 1.9 — real URLs are the foundation the rest sits on.

---

## Gate 3 — after launch. Growth, once it's live and steady.

Deliberately not before launch. Each is easier to justify, and to spec, once
there's real traffic to look at.

### 3.1 Analytics, and the cookie banner it forces — [BOTH] · half a day

Worth noting the order of causation: the site currently sets no tracking cookies
at all, so it needs no consent banner. Add Google Analytics and you inherit the
consent requirement. A cookieless option like Plausible avoids the banner
entirely — weigh that before defaulting to GA.

### 3.2 Courier integration and label printing — [BOTH] · 1–2 days

Whoever he ships with — ACS, Cyprus Post, a local courier — most have an API for
creating consignments and printing labels. Turns packing from retyping addresses
into pressing a button, and gives the customer a tracking number.

### 3.3 Customer accounts and order history — [DEV] · 2–3 days

His current site has these, so expect him to raise it — worth saying out loud in
the meeting that it's a deliberate phase-two cut, not an oversight. Repeat
buyers reordering the same tub is the actual value; "reorder my last one" is the
feature that earns its keep.

### 3.4 Discount codes and abandoned-cart email — [DEV] · 2 days

The two highest-return additions once traffic exists. Discount codes let him run
the Instagram promotions he already runs; abandoned-cart recovery typically pays
for itself faster than anything else on this list.

### 3.5 Invoices and an accounting export — [BOTH] · 1–2 days

Sequential invoice numbering, a PDF per order, and an export his bookkeeper can
actually use. Ask the accountant what format they want *before* building it —
guessing here means doing it twice.

### 3.6 Google and Meta shopping feeds — [DEV] · 1 day

A product feed puts the catalogue into Google Shopping and Instagram tagging.
Needs 2.1 and 2.2 finished first — a feed of drawn placeholder tubs is worse
than no feed.

---

## Already built and tested

So the list above reads in proportion. All of this works now, and 46 automated
checks cover the payment paths (`npm run test:checkout`).

- Card checkout via Viva Smart Checkout, sandbox-verified
- Apple Pay and Google Pay on supported devices
- Cash on delivery, no provider needed
- Reserve online, pay at the counter
- Pay online, collect in Meneou
- Server-side pricing — a tampered price is ignored
- Payment verified against Viva's API, never the browser
- Forged webhooks cannot mark an order paid
- Amount mismatches held for review, not fulfilled
- Webhook catches customers who close the tab after paying
- Free-delivery threshold and COD surcharge
- VAT extracted correctly from inclusive prices
- Order status pages for every outcome
- Full English / Greek toggle on every string
- Shop with filters, sorting and shareable URLs
- Bundle stacks that add three items at once
- Mobile layouts down to 390px
- Sandbox mode fails safe — cannot charge by accident

---

## What it costs to run

Confirm every figure directly with the provider. Pricing and tier terms change,
and Cyprus card rates in particular are negotiated per merchant.

| Service | What for | Rough expectation |
| --- | --- | --- |
| Viva.com | Card processing | Per-transaction fee, plus possible monthly minimum. Ask for a written quote for a Cyprus retail merchant — don't rely on a published headline rate. |
| Vercel | Hosting and the API | Free Hobby tier excludes commercial use, so budget for the paid tier. Check current terms. |
| Upstash Redis | Order storage | Free tier is generous well past this shop's volume. |
| Resend | Order emails | Free tier covers a few thousand emails a month. |
| Domain | `fitnessmaniacs.com.cy` | He already owns it — just needs the DNS pointed. |

One thing worth pricing separately: whoever writes the terms, returns and
privacy policies (1.3). It's the only item here that usually needs paying a
professional, and the one most often left to the last week.
