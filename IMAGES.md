# Photographs to send

Everything in the shop is currently drawn — flat vector garments I generated,
because I have no way to fetch photography. Every one of them is replaced by
dropping a file with the right **name** into the right **folder**. No code
changes, no deploy.

The rule is the same everywhere: **a photo with the matching name wins; where
there is no photo, the drawing stays.** So you can send five files or fifty, in
any order, and the shop keeps working the whole way through.

Accepted formats: `.jpg` `.jpeg` `.png` `.webp` `.avif` — in that order of
preference if you somehow have more than one. **JPG is fine.** Name them in
lowercase exactly as listed; Windows hides extensions by default, so turn on
*View → File name extensions* in File Explorer before renaming.

After copying files in:

```powershell
npm run db:seed
```

---

## 1. Products — `public\products\`

Twelve products. The **front** file is the one that matters; the **back** is
optional and is what the card cross-fades to on hover. Where there is no back
photo, the front is shown again rather than a drawing that does not match.

| # | The product | Front — required | Back — optional |
|---|---|---|---|
| 1 | Oversized Heavyweight Hoodie (men's, charcoal) | `mens-oversized-heavyweight-hoodie.jpg` | `mens-oversized-heavyweight-hoodie-back.jpg` |
| 2 | Boxy Cotton Tee (men's, off-white) | `mens-boxy-cotton-tee.jpg` | `mens-boxy-cotton-tee-back.jpg` |
| 3 | Pleated Wide Trouser (men's, olive-grey) | `mens-pleated-wide-trouser.jpg` | `mens-pleated-wide-trouser-back.jpg` |
| 4 | Cotton Chore Jacket (men's, sage green) | `mens-cotton-chore-jacket.jpg` | `mens-cotton-chore-jacket-back.jpg` |
| 5 | Pleated Short (men's, sand) | `mens-pleated-short.jpg` | `mens-pleated-short-back.jpg` |
| 6 | Ribbed Cotton Socks, 3 Pack (grey) | `ribbed-cotton-socks-three-pack.jpg` | `ribbed-cotton-socks-three-pack-back.jpg` |
| 7 | Sculpt High-Waist Legging (women's, slate) | `womens-sculpt-high-waist-legging.jpg` | `womens-sculpt-high-waist-legging-back.jpg` |
| 8 | Ribbed Seamless Top (women's, dusty rose) | `womens-ribbed-seamless-top.jpg` | `womens-ribbed-seamless-top-back.jpg` |
| 9 | Bias-Cut Slip Dress (women's, blue-grey) | `womens-bias-cut-slip-dress.jpg` | `womens-bias-cut-slip-dress-back.jpg` |
| 10 | Cropped Hoodie (women's, oat) | `womens-cropped-hoodie.jpg` | `womens-cropped-hoodie-back.jpg` |
| 11 | Quilted Liner Jacket (women's, taupe) | `womens-quilted-liner-jacket.jpg` | `womens-quilted-liner-jacket-back.jpg` |
| 12 | Heavy Canvas Tote (natural) | `canvas-tote-bag.jpg` | `canvas-tote-bag-back.jpg` |

**Shape:** portrait, 4:5 (e.g. 1600 × 2000). Anything works, but every card on a
row is cropped to 4:5, so a landscape photo loses its top and bottom.

**What works best:** the same treatment across all twelve — either all on a
plain light background, or all on a model shot the same way, same distance,
same crop. Mixing a flat-lay with a studio model with a street photo is the
single thing that makes a shop look assembled rather than designed. The
colours in brackets are what the drawings use; matching them is not required.

---

## 2. Category tiles — `public\products\`

Eighteen tiles, one per section in the menu and on the homepage. One garment
that represents the category — these are browsing signposts, not product
photos, so a cropped detail or a model shot both work.

**Men**

| Section | File |
|---|---|
| T-Shirts | `category-men-t-shirts.jpg` |
| Shirts | `category-men-shirts.jpg` |
| Hoodies | `category-men-hoodies.jpg` |
| Sweatshirts | `category-men-sweatshirts.jpg` |
| Jackets | `category-men-jackets.jpg` |
| Trousers | `category-men-trousers.jpg` |
| Shorts | `category-men-shorts.jpg` |
| Accessories | `category-men-accessories.jpg` |

**Women**

| Section | File |
|---|---|
| Tops | `category-women-tops.jpg` |
| T-Shirts | `category-women-t-shirts.jpg` |
| Hoodies | `category-women-hoodies.jpg` |
| Sweatshirts | `category-women-sweatshirts.jpg` |
| Jackets | `category-women-jackets.jpg` |
| Leggings | `category-women-leggings.jpg` |
| Trousers | `category-women-trousers.jpg` |
| Shorts | `category-women-shorts.jpg` |
| Dresses | `category-women-dresses.jpg` |
| Accessories | `category-women-accessories.jpg` |

**Shape:** portrait, 3:4 (e.g. 1200 × 1600).

---

## 3. Hero video — `public\hero\`

The top of the homepage is a muted, looping video. Six files, all made from
the one clip you send:

| File | What it is |
|---|---|
| `hero.webm` | desktop loop, VP9 — offered first, about a third smaller |
| `hero.mp4` | desktop loop, H.264 — the fallback every browser plays |
| `hero-mobile.webm` / `hero-mobile.mp4` | the phone version: cut to 2:3 and following the subject, so it is centred on a tall screen instead of cropped off the edge |
| `hero.jpg` / `hero-mobile.jpg` | the loop's first frame, shown instantly while the video loads, and instead of it for anyone whose phone asks for reduced motion or data saving |

**How the loop is made seamless.** A clip's last frame never matches its
first, so a plain repeat jumps. The end of the clip is dissolved into its
beginning over the final 0.8 s with an eased curve, which makes the last frame
lead into the first exactly the way any two neighbouring frames do. There is no
visible join, and it is measured, not eyeballed.

**Sound is removed**, and the files are about a fifth of the original's size
(desktop 1.6 MB, phone 0.6 MB, against 10.7 MB). Browsers only autoplay muted
video anyway.

**To change it**, send me the new clip. What makes a good one:

- 5–10 seconds, landscape, 1080p or better.
- The subject moving *through* the frame or the camera moving slowly — a
  static shot loops more obviously.
- No text in the video. The headline is real text over the top, in three
  languages.
- Keep the left third fairly calm; that is where the words sit on desktop.

If it arrives without a `-mobile` version, the desktop one is used on phones
too. Without any video, the hero falls back to a still `hero.jpg`.

---

## The one thing I have to say plainly

These images will be on a public shop, so they have to be yours to use:
photographs you or someone you hired took, or stock you have licensed
(Unsplash, Pexels and Pixabay are free and permit commercial use). **Do not
send me images taken from DFYNE, Gymshark, ASOS or any other shop** — their
photography is their copyright, using it is a straightforward infringement, and
it would also undo the point of the brief, which was their *interface*, not
their *content*.

If you have no photography yet, licensed stock for every file gets
the shop looking real today, and you can swap in your own product shots one at
a time later — the same drop-in rule, one file at a time.

---

## Sending them

Easiest: copy them straight into the two folders yourself and run
`npm run db:seed`.

Or attach them here and I will place them, rename anything that is off, crop
them to the right shapes, re-seed and send you screenshots. If you attach them,
keep the names above — if a name does not match, the file is ignored silently
and the drawing stays, which looks like nothing happened.
