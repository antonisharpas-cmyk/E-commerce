import { useEffect, useRef, useState } from 'react'
import { IconStar } from './Icons'

/* --- scroll-reveal wrapper ------------------------------------------------ */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    io.observe(el)
    // failsafe: content must never stay invisible, whatever the viewport does
    const fallback = setTimeout(() => setSeen(true), 2500)
    return () => {
      io.disconnect()
      clearTimeout(fallback)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? 'reveal-in' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/* --- buttons -------------------------------------------------------------- */
const BTN =
  'inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'

export const btn = {
  primary: `${BTN} rounded-full bg-brand px-6 py-3 text-[13px] text-ink hover:bg-[#00e076] hover:shadow-[0_10px_34px_-10px_rgba(0,197,102,.8)]`,
  gold: `${BTN} rounded-full bg-gold px-6 py-3 text-[13px] text-ink hover:bg-[#ffe14d] hover:shadow-[0_10px_34px_-10px_rgba(255,212,0,.75)]`,
  ghost: `${BTN} rounded-full border border-line px-6 py-3 text-[13px] text-chalk hover:border-brand hover:text-brand`,
  small: `${BTN} rounded-full bg-brand px-4 py-2 text-[11px] text-ink hover:bg-[#00e076]`,
  smallGhost: `${BTN} rounded-full border border-line px-4 py-2 text-[11px] text-muted hover:border-brand hover:text-brand`,
}

/* --- section heading ------------------------------------------------------ */
export function SectionHead({ eyebrow, title, sub, right, className = '' }) {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-5 ${className}`}>
      <div>
        {eyebrow && (
          <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-brand uppercase">
            <span className="h-px w-7 bg-brand" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-[clamp(1.9rem,4.6vw,3.1rem)]">{title}</h2>
        {sub && <p className="mt-2.5 max-w-xl text-[15px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

/* --- rating stars --------------------------------------------------------- */
export function Rating({ value = 5, count, label, className = '' }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <span className="flex text-gold">
        {[1, 2, 3, 4, 5].map((i) => (
          <IconStar key={i} filled={i <= Math.round(value)} />
        ))}
      </span>
      {count != null && <span className="text-[12px] text-muted">{label}</span>}
    </span>
  )
}

/* --- pill ----------------------------------------------------------------- */
export function Pill({ tone = 'brand', children, className = '' }) {
  const tones = {
    brand: 'bg-brand text-ink',
    gold: 'bg-gold text-ink',
    outline: 'border border-line text-muted',
    dark: 'bg-ink/80 text-chalk border border-line',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
