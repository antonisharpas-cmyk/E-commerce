import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import { useCart } from '../lib/cart'
import { Logo } from './Logo'
import { IconCart, IconChevron, IconMenu, IconSearch, IconX } from './Icons'

const TICKER = ['top.ticker.1', 'top.ticker.2', 'top.ticker.3']

function Ticker() {
  const { t } = useI18n()
  const items = [...TICKER, ...TICKER, ...TICKER, ...TICKER]
  return (
    <div className="overflow-hidden border-b border-line bg-brand-soft/60">
      <div className="marquee-track py-2">
        {items.map((k, i) => (
          <span
            key={i}
            className="flex items-center gap-3 px-6 text-[11px] font-semibold tracking-[0.16em] whitespace-nowrap text-brand uppercase"
          >
            {t(k)}
            <span className="text-gold">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function LangToggle({ className = '' }) {
  const { lang, setLang } = useI18n()
  return (
    <div
      className={`flex items-center rounded-full border border-line p-0.5 text-[11px] font-bold ${className}`}
      role="group"
      aria-label="Language"
    >
      {[
        ['en', 'EN'],
        ['el', 'ΕΛ'],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === code ? 'bg-brand text-ink' : 'text-muted hover:text-chalk'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Header() {
  const { t, tf } = useI18n()
  const cart = useCart()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [mobile, setMobile] = useState(false)
  const [mega, setMega] = useState(false)
  const [q, setQ] = useState('')
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobile(false)
    setMega(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMega(false)
        setMobile(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    nav(`/shop?q=${encodeURIComponent(q)}`)
    setMobile(false)
  }

  const link = ({ isActive }) =>
    `text-[12.5px] font-semibold uppercase tracking-[0.14em] transition-colors ${
      isActive ? 'text-brand' : 'text-chalk/85 hover:text-brand'
    }`

  return (
    <header className="sticky top-0 z-50">
      <Ticker />
      <div
        className={`border-b transition-all duration-300 ${
          solid
            ? 'border-line bg-ink/92 shadow-[0_10px_40px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl'
            : 'border-transparent bg-ink/70 backdrop-blur-md'
        }`}
      >
        <div className="container-x flex h-[68px] items-center gap-4">
          <Link to="/" className="shrink-0" aria-label="K2 Fitness Maniacs — home">
            <Logo />
          </Link>

          {/* desktop nav */}
          <nav className="ml-4 hidden items-center gap-7 lg:flex">
            <NavLink to="/" className={link} end>
              {t('nav.home')}
            </NavLink>
            <div
              className="relative"
              onMouseEnter={() => setMega(true)}
              onMouseLeave={() => setMega(false)}
            >
              <button
                type="button"
                onClick={() => setMega((v) => !v)}
                aria-expanded={mega}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold tracking-[0.14em] text-chalk/85 uppercase transition-colors hover:text-brand"
              >
                {t('nav.categories')}
                <IconChevron
                  width={14}
                  height={14}
                  className={`transition-transform ${mega ? 'rotate-90' : ''}`}
                />
              </button>
              {mega && (
                <div className="absolute top-full left-1/2 w-[620px] -translate-x-1/2 pt-4">
                  <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-ink-2/98 p-3 shadow-2xl backdrop-blur-xl">
                    {CATEGORIES.map((c) => (
                      <Link
                        key={c.slug}
                        to={`/shop?category=${c.slug}`}
                        className="rounded-lg px-3 py-2.5 text-[12.5px] font-medium text-muted transition-colors hover:bg-brand-soft hover:text-brand"
                      >
                        {tf(c)}
                      </Link>
                    ))}
                    <Link
                      to="/shop"
                      className="rounded-lg bg-gold-soft px-3 py-2.5 text-[12.5px] font-bold text-gold transition-colors hover:bg-gold hover:text-ink"
                    >
                      {t('shop.all')} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/shop" className={link}>
              {t('nav.shop')}
            </NavLink>
            <NavLink to="/brands" className={link}>
              {t('nav.brands')}
            </NavLink>
            <NavLink to="/contact" className={link}>
              {t('nav.contact')}
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <form onSubmit={submitSearch} className="hidden md:block">
              <label className="flex h-9 w-44 items-center gap-2 rounded-full border border-line bg-ink-2 px-3 focus-within:border-brand xl:w-56">
                <IconSearch width={15} height={15} className="shrink-0 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('shop.search')}
                  className="w-full bg-transparent text-[12.5px] text-chalk outline-none placeholder:text-muted"
                  aria-label={t('shop.search')}
                />
              </label>
            </form>

            <LangToggle className="hidden sm:flex" />

            <button
              type="button"
              onClick={() => cart.setOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-line text-chalk transition-colors hover:border-brand hover:text-brand"
              aria-label={`${t('cart.title')} (${cart.count})`}
            >
              <IconCart width={19} height={19} />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-extrabold text-ink">
                  {cart.count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobile(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-chalk lg:hidden"
              aria-label={t('nav.menu')}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobile(false)}
            aria-label={t('nav.close')}
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col overflow-y-auto border-l border-line bg-ink-2 p-5">
            <div className="flex items-center justify-between">
              <Logo compact />
              <button
                type="button"
                onClick={() => setMobile(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-line text-chalk"
                aria-label={t('nav.close')}
              >
                <IconX />
              </button>
            </div>

            <form onSubmit={submitSearch} className="mt-5">
              <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-ink px-4 focus-within:border-brand">
                <IconSearch width={16} height={16} className="text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('shop.search')}
                  className="w-full bg-transparent text-[13px] text-chalk outline-none placeholder:text-muted"
                />
              </label>
            </form>

            <nav className="mt-6 flex flex-col">
              {[
                ['/', t('nav.home')],
                ['/shop', t('nav.shop')],
                ['/brands', t('nav.brands')],
                ['/contact', t('nav.contact')],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="border-b border-line py-3.5 text-[15px] font-semibold tracking-wide text-chalk uppercase hover:text-brand"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <p className="mt-7 mb-3 text-[11px] font-bold tracking-[0.22em] text-brand uppercase">
              {t('nav.categories')}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  to={`/shop?category=${c.slug}`}
                  className="rounded-lg border border-line px-3 py-2.5 text-[12px] text-muted hover:border-brand hover:text-brand"
                >
                  {tf(c)}
                </Link>
              ))}
            </div>

            <div className="mt-7">
              <LangToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
