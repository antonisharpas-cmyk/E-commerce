# K2 Fitness Maniacs — concept redesign

A modern storefront concept for **fitnessmaniacs.com.cy** (K2 Fitness Maniacs,
Arch. Makarios Ave Shop 2, Meneou, Larnaca). Built to be shown to the owner as a
replacement for the current Laravel/marketplace-template site.

Not affiliated with or endorsed by the shop — this is an unsolicited proposal.

---

## Run it

```bash
npm install      # once
npm run dev      # http://localhost:5173
```

For the meeting, build a static copy you can open without a server or Wi-Fi:

```bash
npm run build
# then double-click dist/index.html — it just works
```

The app uses `HashRouter` (see `src/main.jsx`) precisely so that `dist/` runs
from `file://`. When it goes on a real host, swap `HashRouter` → `BrowserRouter`
and drop `base: './'` from `vite.config.js`.

---

## What's in it

| Page | Route | What to demo |
| --- | --- | --- |
| Home | `/` | Hero, trust row, 13 categories, flash sale with live countdown, three bundle "stacks", bestsellers, brand marquee, reviews, shop-visit block |
| Shop | `/shop` | Live filtering by category, brand, max price, search, four sort orders — all reflected in the URL, so filtered views are shareable |
| Product | `/product/:id` | Size & flavour pickers, per-serving macros, quantity, stock urgency, related products |
| Brands | `/brands` | All 12 brands, each linking into a filtered shop view |
| Contact | `/contact` | Address, WhatsApp, hours, embedded map, contact form |

Plus a slide-in cart with a free-delivery progress meter, and a full **EN / ΕΛ
toggle** on every string (top-right of the header).

Cart contents and language choice persist in `localStorage`, so the demo
survives a page refresh mid-meeting.

---

## Talking points for the meeting

1. **Speed.** The whole site is one 100 KB gzipped bundle. The current site
   loads a full marketplace template on every page view.
2. **Bilingual done properly.** Every string is in one file
   (`src/lib/i18n.jsx`); the toggle is instant, no page reload, no `?lang=`
   round-trip.
3. **Local advantage front and centre.** Same-day pickup in Meneou, island-wide
   delivery, "official importer stock" — the three things a Larnaca shop has
   that a UK website does not. Currently these appear nowhere on his homepage.
4. **Bundles.** "The Starter / The Cut / The Mass" turn one €35 sale into a €110
   sale, one click. Add-stack-to-cart works in the demo.
5. **Shareable filtered links.** `#/shop?category=proteins&brand=asl` — usable
   in Instagram bios and WhatsApp replies.
6. **Mobile first.** Most of his Instagram traffic is on a phone. Open it at
   390 px wide and it holds up.

---

## Making it his

Everything client-specific is deliberately isolated:

| What | Where |
| --- | --- |
| Colours, fonts, radii | the `@theme` block at the top of `src/index.css` |
| Logo | `src/components/Logo.jsx` — drop the real PNG into `public/` and swap the `<svg>` for an `<img>` |
| Shop address, phone, hours, socials | `src/lib/shop.js` |
| Products, categories, brands | `src/lib/catalog.js` |
| Every piece of copy, EN + ΕΛ | `src/lib/i18n.jsx` |

### Colour tokens currently set

Taken from the K2 logo: black K, green 2, yellow hull, green FITNESS, yellow
MANIACS, green SUPPLEMENTS.

```css
--color-brand: #00c566;  /* green  */
--color-gold:  #ffd400;  /* yellow */
--color-ink:   #06080a;  /* black  */
```

If the real logo hexes differ, change these three lines and the entire site
re-skins — nothing else references a colour directly.

### Product photography

The demo ships with no photos on purpose: each product is drawn as an SVG
container tinted from its own id (`src/components/ProductArt.jsx`), so the grid
looks intentional rather than full of grey placeholders. To use real images, add
`image: '/products/whatever.jpg'` to a product in `catalog.js` — `ProductArt`
already renders an `<img>` when it finds one.

---

## Honest caveats before you pitch

- Prices marked as taken from the live site are real (ASL Isolate €35, ASL Beast
  Whey €60, ASL Mass Gainer €65, BMXX Whey €60, MP Creatine €30, Lipo 6 Black
  €35, Activlab Machine Man €30). Everything else is a realistic placeholder —
  don't quote them as his.
- Opening hours in `src/lib/shop.js` are assumed, not confirmed. Ask him.
- Checkout, accounts, wishlists and real payment are not built. The cart runs
  to a "demo store" confirmation. That's the next phase, and it's worth being
  upfront that it is.
- The map is an OpenStreetMap embed pinned near Meneou, not a surveyed
  coordinate. Get the exact pin from him.

---

## Stack

Vite 8 · React 19 · Tailwind CSS 4 · React Router 7. No UI library, no icon
package, no external assets beyond Google Fonts (Anton + Inter) — and it
degrades to system fonts if there's no internet in the room.
