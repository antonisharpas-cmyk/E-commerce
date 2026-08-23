import { brandOf, formFor } from '../lib/catalog'

/* ==========================================================================
   Placeholder product imagery, drawn as SVG.
   The demo ships with no photography — each product gets a consistent,
   on-brand container silhouette derived from its category, tinted from a hash
   of its id so the grid never looks repetitive.
   TO USE REAL PHOTOS: add `image: '/products/xyz.jpg'` to a product in
   catalog.js and render <img> instead — see ProductArt's early return.
   ========================================================================== */

/* On-brand tints only — greens, golds, teal, lime, amber. Keeps a grid of 30
   products from looking repetitive without drifting off the K2 palette. */
const TINTS = [
  ['#00c566', '#00341d'],
  ['#ffd400', '#382d00'],
  ['#00c5a4', '#00342c'],
  ['#a8d400', '#2c3800'],
  ['#ff9c00', '#382200'],
  ['#38d16a', '#0d3319'],
]

const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000
  return h
}

function Tub({ a, b, label, sub, scale }) {
  return (
    <>
      <ellipse cx="100" cy="176" rx="62" ry="9" fill="#000" opacity=".5" />
      <rect x="52" y="26" width="96" height="20" rx="7" fill={a} />
      <rect x="56" y="30" width="88" height="6" rx="3" fill="#fff" opacity=".22" />
      <path d="M46 46h108l-7 122a8 8 0 0 1-8 7H61a8 8 0 0 1-8-7z" fill="url(#body)" />
      <path d="M46 46h34l-6 129H61a8 8 0 0 1-8-7z" fill="#fff" opacity=".07" />
      <rect x="53" y="74" width="94" height="66" fill={b} />
      <rect x="53" y="74" width="94" height="4" fill={a} />
      <rect x="53" y="136" width="94" height="4" fill={a} />
      <text
        x="100"
        y="104"
        textAnchor="middle"
        fontFamily="Anton, sans-serif"
        fontSize={22 * scale}
        fill={a}
      >
        {label}
      </text>
      <text
        x="100"
        y="124"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2.2"
        fill="#ffffff"
        opacity=".8"
      >
        {sub}
      </text>
    </>
  )
}

function Bottle({ a, b, label, sub, scale }) {
  return (
    <>
      <ellipse cx="100" cy="176" rx="46" ry="8" fill="#000" opacity=".5" />
      <rect x="84" y="20" width="32" height="16" rx="4" fill={a} />
      <rect x="80" y="34" width="40" height="12" rx="3" fill="#2a343a" />
      <path d="M68 46h64l-4 122a8 8 0 0 1-8 7H80a8 8 0 0 1-8-7z" fill="url(#body)" />
      <path d="M68 46h22l-4 129h-6a8 8 0 0 1-8-7z" fill="#fff" opacity=".07" />
      <rect x="70" y="76" width="60" height="66" fill={b} />
      <rect x="70" y="76" width="60" height="3.5" fill={a} />
      <rect x="70" y="138.5" width="60" height="3.5" fill={a} />
      <text
        x="100"
        y="106"
        textAnchor="middle"
        fontFamily="Anton, sans-serif"
        fontSize={19 * scale}
        fill={a}
      >
        {label}
      </text>
      <text
        x="100"
        y="124"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1.8"
        fill="#fff"
        opacity=".8"
      >
        {sub}
      </text>
    </>
  )
}

function Bar({ a, b, label, sub, scale }) {
  return (
    <>
      <ellipse cx="100" cy="168" rx="66" ry="8" fill="#000" opacity=".5" />
      <rect x="26" y="62" width="148" height="98" rx="10" fill="url(#body)" />
      <rect x="34" y="70" width="132" height="82" rx="6" fill={b} />
      <rect x="34" y="70" width="132" height="7" fill={a} />
      <path d="M26 62h148l-8-14H34z" fill={a} opacity=".85" />
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="Anton, sans-serif"
        fontSize={24 * scale}
        fill={a}
      >
        {label}
      </text>
      <text
        x="100"
        y="132"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2.4"
        fill="#fff"
        opacity=".8"
      >
        {sub}
      </text>
    </>
  )
}

function Can({ a, b, label, sub, scale }) {
  return (
    <>
      <ellipse cx="100" cy="176" rx="42" ry="8" fill="#000" opacity=".5" />
      <ellipse cx="100" cy="30" rx="34" ry="8" fill="#8b969c" />
      <ellipse cx="100" cy="30" rx="26" ry="5.5" fill="#5d666b" />
      <path d="M66 30h68v138a6 6 0 0 1-6 6H72a6 6 0 0 1-6-6z" fill="url(#body)" />
      <path d="M66 30h18v144h-12a6 6 0 0 1-6-6z" fill="#fff" opacity=".07" />
      <rect x="67" y="62" width="66" height="82" fill={b} />
      <rect x="67" y="62" width="66" height="4" fill={a} />
      <rect x="67" y="140" width="66" height="4" fill={a} />
      <text
        x="100"
        y="100"
        textAnchor="middle"
        fontFamily="Anton, sans-serif"
        fontSize={20 * scale}
        fill={a}
      >
        {label}
      </text>
      <text
        x="100"
        y="120"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1.6"
        fill="#fff"
        opacity=".8"
      >
        {sub}
      </text>
    </>
  )
}

function Sachet({ a, b, label, sub, scale }) {
  return (
    <>
      <ellipse cx="100" cy="170" rx="50" ry="8" fill="#000" opacity=".5" />
      <path d="M46 34h108v128H46z" fill="url(#body)" />
      <path d="M46 34h30v128H46z" fill="#fff" opacity=".07" />
      <path
        d="M46 34h108v8H46zM46 154h108v8H46z"
        fill={a}
        opacity=".9"
      />
      <rect x="48" y="66" width="104" height="66" fill={b} />
      <text
        x="100"
        y="98"
        textAnchor="middle"
        fontFamily="Anton, sans-serif"
        fontSize={22 * scale}
        fill={a}
      >
        {label}
      </text>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2.2"
        fill="#fff"
        opacity=".8"
      >
        {sub}
      </text>
    </>
  )
}

const SHAPES = { tub: Tub, bottle: Bottle, bar: Bar, can: Can, sachet: Sachet }

export default function ProductArt({ product, className = '' }) {
  if (product.image) {
    return <img src={product.image} alt={product.name} className={className} loading="lazy" />
  }

  const form = formFor(product)
  const Shape = SHAPES[form] ?? Tub
  const [a, b] = TINTS[hash(product.id) % TINTS.length]
  const brand = brandOf(product.brand)
  const label = brand?.name ?? 'FM'
  const sub = product.sizes[0] ?? ''
  const gid = `g-${product.id}`
  // shrink the wordmark so long brand names ("MUSCLE POWER") still fit the label
  const scale = label.length > 11 ? 0.52 : label.length > 8 ? 0.68 : 1

  return (
    <svg viewBox="0 0 200 190" className={className} role="img" aria-label={product.name}>
      <defs>
        <radialGradient id={gid} cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor={a} stopOpacity="0.28" />
          <stop offset="1" stopColor={a} stopOpacity="0" />
        </radialGradient>
        {/* shared, identical in every instance — the shape fns reference url(#body) */}
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b2328" />
          <stop offset="0.35" stopColor="#2d383f" />
          <stop offset="1" stopColor="#131a1e" />
        </linearGradient>
      </defs>
      <rect width="200" height="190" fill={`url(#${gid})`} />
      <Shape a={a} b={b} label={label} sub={sub} scale={scale} />
    </svg>
  )
}
