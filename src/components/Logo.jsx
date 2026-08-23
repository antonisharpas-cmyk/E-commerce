/* ==========================================================================
   Brand mark, drawn in SVG so it stays crisp at any size.
   Colour roles follow the real logo:
     K = black (rendered chalk-white on dark surfaces) · 2 = green
     badge hull = yellow · FITNESS = green · MANIACS = yellow
   TO USE THE REAL LOGO FILE: drop it in /public and replace the <svg> below
   with <img src="/logo.png" alt="K2 Fitness Maniacs" />.
   ========================================================================== */

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      role="presentation"
    >
      {/* yellow hull */}
      <path
        d="M32 2.5 58 15v22.5c0 12-11 20.5-26 24-15-3.5-26-12-26-24V15z"
        fill="#0c1013"
        stroke="var(--color-gold)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 8.5 52.5 18.5v18.6c0 9.4-8.6 16.2-20.5 19-11.9-2.8-20.5-9.6-20.5-19V18.5z"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1"
        strokeOpacity="0.35"
        strokeLinejoin="round"
      />
      <text
        x="16.5"
        y="44"
        fontFamily="Anton, 'Arial Narrow', sans-serif"
        fontSize="30"
        fill="var(--color-chalk)"
        textAnchor="middle"
      >
        K
      </text>
      <text
        x="42"
        y="44"
        fontFamily="Anton, 'Arial Narrow', sans-serif"
        fontSize="30"
        fill="var(--color-brand)"
        textAnchor="middle"
      >
        2
      </text>
    </svg>
  )
}

export function Logo({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <LogoMark size={compact ? 34 : 42} />
      <span className="leading-none">
        <span className="display block text-[15px] tracking-[0.02em] sm:text-[17px]">
          <span className="text-brand">FITNESS</span>
          <span className="text-gold"> MANIACS</span>
        </span>
        <span className="mt-[3px] block text-[8.5px] font-semibold tracking-[0.42em] text-brand/80">
          SUPPLEMENTS
        </span>
      </span>
    </span>
  )
}
