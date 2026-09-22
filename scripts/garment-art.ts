/* ============================================================================
 * Garment artwork.
 *
 * Draws each product as the garment it actually is — a hoodie with a hood,
 * drawstrings and ribbed cuffs, a slip dress with a bias hem, a tote with
 * handles — in that product's own colourway, on a studio backdrop.
 *
 * This is scaffolding, not an ambition: a real shop photographs its stock, and
 * `npm run art` writes these only where no photograph exists (see
 * scripts/generate-art.ts). Until the photographs arrive, a drawn hoodie tells
 * a customer far more than a grey rectangle does.
 *
 * Vector, so a whole catalogue of them weighs less than one photograph and
 * stays sharp on any screen.
 * ========================================================================== */

export type GarmentKind =
  | 'hoodie'
  | 'cropped-hoodie'
  | 'tee'
  | 'shirt'
  | 'sweatshirt'
  | 'chore-jacket'
  | 'quilted-jacket'
  | 'trousers'
  | 'shorts'
  | 'leggings'
  | 'top'
  | 'dress'
  | 'socks'
  | 'tote'

export type View = 'front' | 'back'

const W = 900
const H = 1200

/* ------------------------------------------------------------- colour ---- */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/** Lighten (amount > 0) or darken (amount < 0) by a fraction. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex)
  const t = amount < 0 ? 0 : 255
  const p = Math.abs(amount)
  return (
    '#' +
    [r, g, b]
      .map((c) => clamp((t - c) * p + c).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** Perceived brightness, for deciding whether details should go lighter or
 *  darker — a black hoodie needs light seams, a bone tee needs dark ones. */
function isDark(hex: string): boolean {
  const [r, g, b] = parse(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

/* --------------------------------------------------------------- pieces -- */

type Palette = {
  base: string
  light: string
  dark: string
  deeper: string
  seam: string
  detail: string
}

function palette(color: string): Palette {
  const dark = isDark(color)
  return {
    base: color,
    light: shade(color, dark ? 0.22 : 0.14),
    dark: shade(color, -0.14),
    deeper: shade(color, -0.3),
    /* Stitching reads as a slightly different tone of the same cloth, never
       as a black line drawn on top. */
    seam: shade(color, dark ? 0.3 : -0.28),
    detail: shade(color, dark ? 0.4 : -0.42),
  }
}

/** Studio backdrop, soft light from the upper left, with the floor shadow the
 *  garment sits in. Every garment shares it, so the set looks shot together. */
function backdrop(id: string) {
  /* The same paper for every garment. Tinting each backdrop to its own product
     made the grid look like twelve separate shoots. */
  const paper = '#e9e6e1'
  return `
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${shade(paper, 0.55)}"/>
      <stop offset="0.55" stop-color="${paper}"/>
      <stop offset="1" stop-color="${shade(paper, -0.1)}"/>
    </linearGradient>
    <radialGradient id="spot-${id}" cx="0.38" cy="0.3" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="floor-${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000000" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-${id})"/>
  <rect width="${W}" height="${H}" fill="url(#spot-${id})"/>`
}

function cloth(id: string, p: Palette) {
  return `
    <linearGradient id="cloth-${id}" x1="0.15" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${p.light}"/>
      <stop offset="0.45" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.dark}"/>
    </linearGradient>
    <linearGradient id="fold-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
    </linearGradient>`
}

/** Ribbing: the knitted band at a cuff or hem. Short vertical strokes. */
function ribbing(x: number, y: number, w: number, h: number, p: Palette, step = 11) {
  const lines: string[] = []
  for (let i = x + step; i < x + w; i += step) {
    lines.push(`M${i.toFixed(1)} ${y} L${(i - h * 0.04).toFixed(1)} ${y + h}`)
  }
  return `<path d="${lines.join(' ')}" stroke="${p.seam}" stroke-width="1.6" opacity="0.5" fill="none"/>`
}

const stitch = (d: string, p: Palette, width = 2) =>
  `<path d="${d}" fill="none" stroke="${p.seam}" stroke-width="${width}" stroke-dasharray="7 6" stroke-linecap="round" opacity="0.75"/>`

const shadowUnder = (id: string, cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#floor-${id})"/>`

/* ---------------------------------------------------------- the garments -- */

function hoodieBody(id: string, p: Palette, view: View, cropped: boolean) {
  const hem = cropped ? 760 : 940
  const bodyBottom = hem
  const cuffY = cropped ? 690 : 760

  return `
  ${shadowUnder(id, 450, bodyBottom + 30, 300, 34)}

  <!-- sleeves, drawn first so the body overlaps them -->
  <path d="M255 330 C170 380 140 520 128 ${cuffY - 20} L232 ${cuffY} C250 600 268 470 300 400 Z"
        fill="url(#cloth-${id})"/>
  <path d="M645 330 C730 380 760 520 772 ${cuffY - 20} L668 ${cuffY} C650 600 632 470 600 400 Z"
        fill="url(#cloth-${id})"/>

  <!-- body: dropped shoulders, boxy -->
  <path d="M300 300 C380 268 520 268 600 300
           L648 330 C672 470 676 640 672 ${bodyBottom}
           L228 ${bodyBottom} C224 640 228 470 252 330 Z"
        fill="url(#cloth-${id})"/>

  <!-- the shaded right-hand side -->
  <path d="M470 290 C560 285 620 300 648 330 C672 470 676 640 672 ${bodyBottom}
           L470 ${bodyBottom} Z" fill="url(#fold-${id})"/>

  <!-- hood -->
  ${
    view === 'front'
      ? `<path d="M330 300 C355 195 545 195 570 300 C520 340 380 340 330 300 Z"
              fill="${p.dark}"/>
         <path d="M344 296 C372 214 528 214 556 296 C508 330 392 330 344 296 Z"
              fill="${p.deeper}"/>
         <circle cx="416" cy="322" r="7" fill="${p.detail}" opacity="0.8"/>
         <circle cx="484" cy="322" r="7" fill="${p.detail}" opacity="0.8"/>
         <path d="M416 328 C412 400 408 440 404 470" stroke="${p.detail}" stroke-width="7"
               fill="none" stroke-linecap="round"/>
         <path d="M484 328 C490 400 496 448 500 482" stroke="${p.detail}" stroke-width="7"
               fill="none" stroke-linecap="round"/>`
      : `<path d="M330 300 C355 180 545 180 570 300 C520 250 380 250 330 300 Z"
              fill="url(#cloth-${id})"/>
         ${stitch('M348 286 C380 226 520 226 552 286', p)}`
  }

  <!-- pocket -->
  ${
    view === 'front' && !cropped
      ? `${stitch(`M300 ${hem - 250} L600 ${hem - 250}`, p)}
         ${stitch(`M300 ${hem - 250} C296 ${hem - 150} 300 ${hem - 110} 316 ${hem - 90} L584 ${hem - 90} C600 ${hem - 110} 604 ${hem - 150} 600 ${hem - 250}`, p)}`
      : ''
  }

  <!-- cuffs and hem -->
  <path d="M128 ${cuffY - 20} L232 ${cuffY} L228 ${cuffY + 56} L124 ${cuffY + 34} Z" fill="${p.dark}"/>
  <path d="M772 ${cuffY - 20} L668 ${cuffY} L672 ${cuffY + 56} L776 ${cuffY + 34} Z" fill="${p.dark}"/>
  <rect x="228" y="${bodyBottom - 56}" width="444" height="56" fill="${p.dark}"/>
  ${ribbing(228, bodyBottom - 56, 444, 56, p)}
  ${stitch(`M252 330 C240 420 232 560 228 ${bodyBottom - 56}`, p)}
  ${stitch(`M648 330 C660 420 668 560 672 ${bodyBottom - 56}`, p)}`
}

function teeBody(id: string, p: Palette, view: View, long = false) {
  const hem = 880
  return `
  ${shadowUnder(id, 450, hem + 28, 280, 30)}

  <path d="M290 318 C214 352 186 416 168 ${long ? 720 : 520} L268 ${long ? 748 : 548}
           C288 470 300 400 312 366 Z" fill="url(#cloth-${id})"/>
  <path d="M610 318 C686 352 714 416 732 ${long ? 720 : 520} L632 ${long ? 748 : 548}
           C612 470 600 400 588 366 Z" fill="url(#cloth-${id})"/>

  <path d="M312 330 C372 292 528 292 588 330
           L624 358 C648 520 652 720 648 ${hem}
           L252 ${hem} C248 720 252 520 276 358 Z" fill="url(#cloth-${id})"/>

  <path d="M470 300 C545 300 585 312 624 358 C648 520 652 720 648 ${hem} L470 ${hem} Z"
        fill="url(#fold-${id})"/>

  <!-- collar -->
  ${
    view === 'front'
      ? `<path d="M372 316 C400 368 500 368 528 316 C498 296 402 296 372 316 Z" fill="${p.deeper}"/>
         <path d="M380 312 C406 356 494 356 520 312" fill="none" stroke="${p.detail}" stroke-width="7"/>`
      : `<path d="M374 310 C402 340 498 340 526 310 C498 296 402 296 374 310 Z" fill="${p.deeper}"/>`
  }

  ${stitch(`M268 ${hem - 22} L632 ${hem - 22}`, p)}
`
}

function shirtBody(id: string, p: Palette, view: View) {
  const hem = 900
  return `
  ${shadowUnder(id, 450, hem + 28, 280, 30)}
  <path d="M292 322 C216 356 190 430 176 640 L276 666 C294 520 304 420 314 370 Z" fill="url(#cloth-${id})"/>
  <path d="M608 322 C684 356 710 430 724 640 L624 666 C606 520 596 420 586 370 Z" fill="url(#cloth-${id})"/>
  <path d="M314 334 C374 296 526 296 586 334 L620 360 C644 520 648 720 644 ${hem}
           L256 ${hem} C252 720 256 520 280 360 Z" fill="url(#cloth-${id})"/>
  <path d="M470 304 C545 304 582 316 620 360 C644 520 648 720 644 ${hem} L470 ${hem} Z"
        fill="url(#fold-${id})"/>
  ${
    view === 'front'
      ? `<!-- collar and placket -->
         <path d="M380 312 L450 380 L400 400 L358 340 Z" fill="${p.dark}"/>
         <path d="M520 312 L450 380 L500 400 L542 340 Z" fill="${p.dark}"/>
         <path d="M450 380 L450 ${hem}" stroke="${p.seam}" stroke-width="3" opacity="0.8"/>
         ${[440, 540, 640, 740, 840].map((y) => `<circle cx="450" cy="${y}" r="7" fill="${p.detail}" opacity="0.85"/>`).join('')}
         ${stitch(`M424 380 L424 ${hem}`, p, 1.6)}
         ${stitch(`M476 380 L476 ${hem}`, p, 1.6)}`
      : `<path d="M300 360 L600 360" stroke="${p.seam}" stroke-width="3" opacity="0.6"/>
         <path d="M374 306 C402 336 498 336 526 306 C498 292 402 292 374 306 Z" fill="${p.dark}"/>`
  }
  ${stitch(`M276 660 L180 634`, p)}
  ${stitch(`M624 660 L720 634`, p)}`
}

function choreJacket(id: string, p: Palette, view: View) {
  const hem = 900
  return `
  ${shadowUnder(id, 450, hem + 28, 290, 32)}
  <path d="M286 320 C208 356 180 430 166 660 L272 688 C290 530 300 420 310 368 Z" fill="url(#cloth-${id})"/>
  <path d="M614 320 C692 356 720 430 734 660 L628 688 C610 530 600 420 590 368 Z" fill="url(#cloth-${id})"/>
  <path d="M310 332 C372 294 528 294 590 332 L626 360 C650 520 654 720 650 ${hem}
           L250 ${hem} C246 720 250 520 274 360 Z" fill="url(#cloth-${id})"/>
  <path d="M470 302 C548 302 588 314 626 360 C650 520 654 720 650 ${hem} L470 ${hem} Z"
        fill="url(#fold-${id})"/>
  <!-- camp collar -->
  <path d="M368 306 C398 300 402 340 448 366 C494 340 498 300 528 306
           C520 348 500 372 448 392 C396 372 376 348 368 306 Z" fill="${p.dark}"/>
  ${
    view === 'front'
      ? `<path d="M448 392 L448 ${hem}" stroke="${p.seam}" stroke-width="3" opacity="0.8"/>
         ${[470, 570, 670, 770, 860].map((y) => `<circle cx="448" cy="${y}" r="8" fill="${p.detail}" opacity="0.85"/>`).join('')}
         <!-- patch pockets -->
         <rect x="296" y="640" width="136" height="150" rx="6" fill="${p.dark}" opacity="0.55"/>
         <rect x="468" y="640" width="136" height="150" rx="6" fill="${p.dark}" opacity="0.55"/>
         ${stitch('M300 644 L428 644 L428 786 L300 786 Z', p, 1.8)}
         ${stitch('M472 644 L600 644 L600 786 L472 786 Z', p, 1.8)}
         <rect x="352" y="440" width="96" height="16" rx="4" fill="${p.dark}" opacity="0.4"/>`
      : `<path d="M300 420 C380 400 520 400 600 420" stroke="${p.seam}" stroke-width="3" opacity="0.6" fill="none"/>`
  }
  ${stitch(`M274 360 C258 520 252 720 250 ${hem - 14}`, p)}
  ${stitch(`M626 360 C642 520 648 720 650 ${hem - 14}`, p)}`
}

function quiltedJacket(id: string, p: Palette, view: View) {
  const hem = 890
  /* The quilting: horizontal channels with a soft ridge along each seam. */
  const channels: string[] = []
  for (let y = 380; y < hem - 20; y += 78) {
    channels.push(
      `<path d="M256 ${y} C380 ${y - 10} 520 ${y - 10} 644 ${y}" fill="none" stroke="${p.seam}" stroke-width="2.4" opacity="0.7"/>`,
      `<path d="M256 ${y + 6} C380 ${y - 4} 520 ${y - 4} 644 ${y + 6}" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.35"/>`,
    )
  }
  return `
  ${shadowUnder(id, 450, hem + 28, 290, 32)}
  <path d="M288 322 C206 358 180 440 168 660 L276 690 C292 530 302 422 312 370 Z" fill="url(#cloth-${id})"/>
  <path d="M612 322 C694 358 720 440 732 660 L624 690 C608 530 598 422 588 370 Z" fill="url(#cloth-${id})"/>
  <path d="M312 334 C372 296 528 296 588 334 L624 362 C648 520 652 720 648 ${hem}
           L252 ${hem} C248 720 252 520 276 362 Z" fill="url(#cloth-${id})"/>
  <path d="M470 304 C546 304 586 316 624 362 C648 520 652 720 648 ${hem} L470 ${hem} Z"
        fill="url(#fold-${id})"/>
  ${channels.join('\n  ')}
  <path d="M372 312 C402 350 498 350 528 312 C498 294 402 294 372 312 Z" fill="${p.deeper}"/>
  ${
    view === 'front'
      ? `<path d="M450 340 L450 ${hem}" stroke="${p.detail}" stroke-width="5" opacity="0.9"/>
         <circle cx="450" cy="360" r="9" fill="${p.detail}"/>`
      : ''
  }
  <rect x="252" y="${hem - 40}" width="396" height="40" fill="${p.dark}"/>`
}

function trousersBody(id: string, p: Palette, view: View, short: boolean, skinny = false) {
  const hem = short ? 700 : 1080
  const waistW = skinny ? 250 : 300
  /* Width of ONE leg opening, and the gap between the two. */
  const legW = skinny ? 80 : short ? 176 : 122
  const gap = skinny ? 8 : 18
  const crotch = short ? 500 : 520

  const left = 450 - waistW / 2
  const right = 450 + waistW / 2
  const outerL = 450 - gap - legW
  const innerL = 450 - gap
  const innerR = 450 + gap
  const outerR = 450 + gap + legW

  /* Control points are expressed relative to the hem. Fixed values worked for
     full-length trousers and hung BELOW the hem on shorts, which drew a spike
     at each corner. */
  const knee = 250 + (hem - 250) * 0.45
  const near = hem - (hem - 250) * 0.18

  const outline = `
    M${left} 250
    C${left - 6} ${knee} ${outerL + 6} ${near} ${outerL} ${hem}
    L${innerL} ${hem}
    C${innerL - 4} ${near} 446 ${crotch + 70} 450 ${crotch}
    C454 ${crotch + 70} ${innerR + 4} ${near} ${innerR} ${hem}
    L${outerR} ${hem}
    C${outerR - 6} ${near} ${right + 6} ${knee} ${right} 250 Z`

  return `
  ${shadowUnder(id, 450, hem + 26, 230, 28)}
  <path d="${outline}" fill="url(#cloth-${id})"/>
  <!-- the right half falls into shade -->
  <path d="M450 ${crotch} C454 ${crotch + 70} ${innerR + 4} ${near} ${innerR} ${hem}
           L${outerR} ${hem} C${outerR - 6} ${near} ${right + 6} ${knee} ${right} 250
           L450 250 Z" fill="url(#fold-${id})"/>

  <!-- waistband -->
  <rect x="${left - 6}" y="228" width="${waistW + 12}" height="${skinny ? 62 : 52}" rx="4" fill="${p.dark}"/>
  ${
    skinny
      ? ribbing(left - 6, 228, waistW + 12, 62, p, 16)
      : `${stitch(`M${left} 240 L${right} 240`, p, 1.8)}
         ${stitch(`M${left} 272 L${right} 272`, p, 1.8)}
         <circle cx="450" cy="256" r="7" fill="${p.detail}" opacity="0.85"/>
         <!-- the pleats this trouser is named for -->
         <path d="M${450 - legW / 2 - gap} 292 L${446 - legW / 2 - gap} ${hem - (short ? 120 : 40)}"
               stroke="${p.seam}" stroke-width="2.6" opacity="0.6" fill="none"/>
         <path d="M${450 + legW / 2 + gap} 292 L${454 + legW / 2 + gap} ${hem - (short ? 120 : 40)}"
               stroke="${p.seam}" stroke-width="2.6" opacity="0.6" fill="none"/>`
  }
  ${view === 'front' ? `<path d="M450 282 L450 ${crotch - 30}" stroke="${p.seam}" stroke-width="2" opacity="0.45"/>` : ''}
  <!-- hems -->
  ${stitch(`M${outerL + 26} ${hem - 26} L${innerL - 18} ${hem - 26}`, p, 1.8)}
  ${stitch(`M${innerR + 18} ${hem - 26} L${outerR - 26} ${hem - 26}`, p, 1.8)}`
}

function topBody(id: string, p: Palette) {
  const hem = 700
  const rib: string[] = []
  for (let x = 322; x < 578; x += 14) {
    rib.push(`M${x} 300 C${x - 4} 450 ${x - 4} 600 ${x} ${hem}`)
  }
  return `
  ${shadowUnder(id, 450, hem + 24, 190, 24)}
  <path d="M322 320 C360 284 540 284 578 320
           C596 440 598 580 592 ${hem} L308 ${hem} C302 580 304 440 322 320 Z"
        fill="url(#cloth-${id})"/>
  <path d="M470 296 C540 296 566 306 578 320 C596 440 598 580 592 ${hem} L470 ${hem} Z"
        fill="url(#fold-${id})"/>
  <path d="${rib.join(' ')}" fill="none" stroke="${p.seam}" stroke-width="1.5" opacity="0.4"/>
  <!-- straps: they rise and stop, the way a vest lies flat. Curving them
       together over the neckline made it read as a handbag. -->
  <path d="M370 252 L364 318" fill="none" stroke="${p.base}" stroke-width="30" stroke-linecap="round"/>
  <path d="M530 252 L536 318" fill="none" stroke="${p.dark}" stroke-width="30" stroke-linecap="round"/>
  <!-- the scoop between the straps, cut into the body -->
  <path d="M384 306 C404 372 496 372 516 306 C482 296 418 296 384 306 Z" fill="${p.deeper}"/>`
}

function dressBody(id: string, p: Palette) {
  const hem = 1060
  return `
  ${shadowUnder(id, 450, hem + 24, 250, 28)}
  <!-- bias cut: narrow at the waist, falling wide and slightly asymmetric -->
  <path d="M356 300 C392 268 508 268 544 300
           C556 400 546 470 540 540
           C566 700 606 880 636 ${hem}
           L268 ${hem} C298 880 336 700 360 540
           C354 470 344 400 356 300 Z" fill="url(#cloth-${id})"/>
  <path d="M470 280 C520 280 534 288 544 300 C556 400 546 470 540 540
           C566 700 606 880 636 ${hem} L470 ${hem} Z" fill="url(#fold-${id})"/>
  <!-- the fall of the fabric -->
  <path d="M410 560 C396 740 372 900 348 ${hem - 10}" fill="none" stroke="${p.seam}" stroke-width="2" opacity="0.45"/>
  <path d="M490 560 C504 740 528 900 552 ${hem - 10}" fill="none" stroke="${p.seam}" stroke-width="2" opacity="0.45"/>
  <path d="M450 300 L450 540" stroke="${p.seam}" stroke-width="1.8" opacity="0.35"/>
  <!-- cowl neck, and two fine straps that rise and stop -->
  <path d="M368 296 C400 344 500 344 532 296 C500 274 400 274 368 296 Z" fill="${p.deeper}"/>
  <path d="M392 250 L388 300" fill="none" stroke="${p.base}" stroke-width="12" stroke-linecap="round"/>
  <path d="M508 250 L512 300" fill="none" stroke="${p.dark}" stroke-width="12" stroke-linecap="round"/>`
}

function socksArt(id: string, p: Palette) {
  /* One sock: a ribbed cuff, a leg, a heel that turns, and a toe. Drawn at a
     fixed position and then translated — the earlier version rotated about a
     point outside the shape and flew apart. */
  const sock = (x: number, y: number, tilt: number) => `
    <g transform="translate(${x} ${y}) rotate(${tilt} 90 300)">
      <!-- leg and foot in one outline -->
      <path d="M40 60
               L140 60
               L140 330
               C140 372 152 392 186 400
               L248 414
               C292 424 300 470 268 486
               C236 502 180 496 140 476
               C86 450 44 410 40 340 Z"
            fill="url(#cloth-${id})"/>
      <!-- the heel, a shade deeper -->
      <path d="M40 340 C44 410 86 450 140 476 L140 380 C104 372 66 360 40 340 Z"
            fill="${p.deeper}" opacity="0.55"/>
      <!-- toe -->
      <path d="M248 414 C292 424 300 470 268 486 C252 494 232 494 212 488
               C246 470 254 440 248 414 Z" fill="${p.dark}"/>
      <!-- ribbed cuff -->
      <rect x="34" y="48" width="112" height="86" rx="6" fill="${p.dark}"/>
      ${ribbing(34, 48, 112, 86, p, 10)}
      <path d="M52 170 L128 170" stroke="${p.seam}" stroke-width="2" opacity="0.35"/>
      <path d="M52 210 L128 210" stroke="${p.seam}" stroke-width="2" opacity="0.35"/>
    </g>`

  return `
  ${shadowUnder(id, 450, 900, 300, 30)}
  ${sock(60, 330, -5)}
  ${sock(320, 360, 0)}
  ${sock(580, 330, 5)}`
}

function toteArt(id: string, p: Palette) {
  return `
  ${shadowUnder(id, 450, 950, 250, 26)}
  <!-- handles behind the body -->
  <path d="M352 400 C352 250 548 250 548 400" fill="none" stroke="${p.dark}" stroke-width="22" stroke-linecap="round"/>
  <path d="M352 400 C352 262 548 262 548 400" fill="none" stroke="${p.base}" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
  <!-- body -->
  <path d="M268 396 L632 396 C644 560 648 760 640 920 L260 920 C252 760 256 560 268 396 Z"
        fill="url(#cloth-${id})"/>
  <path d="M450 396 L632 396 C644 560 648 760 640 920 L450 920 Z" fill="url(#fold-${id})"/>
  <!-- canvas weave -->
  ${Array.from({ length: 14 }, (_, i) => `<path d="M264 ${420 + i * 36} L636 ${420 + i * 36}" stroke="${p.seam}" stroke-width="1" opacity="0.18"/>`).join('')}
  ${stitch('M272 404 L628 404', p, 2)}
  ${stitch('M268 906 L632 906', p, 2)}
  <rect x="348" y="398" width="16" height="34" fill="${p.detail}" opacity="0.5"/>
  <rect x="536" y="398" width="16" height="34" fill="${p.detail}" opacity="0.5"/>`
}

/* ------------------------------------------------------------------ api -- */

export function garmentSvg(
  kind: GarmentKind,
  colors: [string, string],
  view: View = 'front',
): string {
  const p = palette(colors[0])
  const id = 'g'

  let body: string
  switch (kind) {
    case 'hoodie':
      body = hoodieBody(id, p, view, false)
      break
    case 'cropped-hoodie':
      body = hoodieBody(id, p, view, true)
      break
    case 'sweatshirt':
      body = hoodieBody(id, p, view, false)
      break
    case 'tee':
      body = teeBody(id, p, view)
      break
    case 'shirt':
      body = shirtBody(id, p, view)
      break
    case 'chore-jacket':
      body = choreJacket(id, p, view)
      break
    case 'quilted-jacket':
      body = quiltedJacket(id, p, view)
      break
    case 'trousers':
      body = trousersBody(id, p, view, false)
      break
    case 'shorts':
      body = trousersBody(id, p, view, true)
      break
    case 'leggings':
      body = trousersBody(id, p, view, false, true)
      break
    case 'top':
      body = topBody(id, p)
      break
    case 'dress':
      body = dressBody(id, p)
      break
    case 'socks':
      body = socksArt(id, p)
      break
    case 'tote':
      body = toteArt(id, p)
      break
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
${backdrop(id)}
  <defs>${cloth(id, p)}</defs>
  ${body}
</svg>`
}
