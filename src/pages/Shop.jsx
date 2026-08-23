import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BRANDS, CATEGORIES, PRICE_MAX, PRODUCTS } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import ProductCard from '../components/ProductCard'
import { Reveal, btn } from '../components/ui'
import { IconSearch, IconX } from '../components/Icons'

const SORTS = ['featured', 'priceAsc', 'priceDesc', 'rating']

export default function Shop() {
  const { t, tf } = useI18n()
  const [params, setParams] = useSearchParams()

  const category = params.get('category') || ''
  const brand = params.get('brand') || ''
  const sort = SORTS.includes(params.get('sort')) ? params.get('sort') : 'featured'
  const maxPrice = Number(params.get('max')) || PRICE_MAX
  const q = params.get('q') || ''
  const [search, setSearch] = useState(q)

  useEffect(() => setSearch(q), [q])

  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'featured') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = PRODUCTS.filter(
      (p) =>
        (!category || p.category === category) &&
        (!brand || p.brand === brand) &&
        p.price <= maxPrice &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          p.en.toLowerCase().includes(needle) ||
          p.brand.includes(needle)),
    )
    if (sort === 'priceAsc') out = [...out].sort((a, b) => a.price - b.price)
    if (sort === 'priceDesc') out = [...out].sort((a, b) => b.price - a.price)
    if (sort === 'rating') out = [...out].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    return out
  }, [category, brand, sort, maxPrice, q])

  const active = Boolean(category || brand || q || maxPrice !== PRICE_MAX)

  const chip = (on) =>
    `rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
      on ? 'border-brand bg-brand text-ink' : 'border-line text-muted hover:border-brand hover:text-brand'
    }`

  return (
    <div className="container-x py-12">
      {/* header */}
      <div className="border-b border-line pb-8">
        <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-brand uppercase">
          <span className="h-px w-7 bg-brand" />
          {t('nav.shop')}
        </p>
        <h1 className="text-[clamp(2.2rem,5.5vw,3.6rem)]">
          {category ? tf(CATEGORIES.find((c) => c.slug === category) ?? {}) : t('shop.title')}
        </h1>
        <p className="mt-2.5 text-[14px] text-muted">{t('shop.results', { n: results.length })}</p>
      </div>

      <div className="grid gap-9 pt-8 lg:grid-cols-[240px_1fr]">
        {/* ------------------------------------------------------- sidebar */}
        <aside className="lg:sticky lg:top-[150px] lg:self-start">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              set('q', search)
            }}
            className="mb-7"
          >
            <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-ink-2 px-4 focus-within:border-brand">
              <IconSearch width={16} height={16} className="shrink-0 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('shop.search')}
                className="w-full bg-transparent text-[13px] text-chalk outline-none placeholder:text-muted"
                aria-label={t('shop.search')}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    set('q', '')
                  }}
                  className="text-muted hover:text-chalk"
                  aria-label={t('shop.clear')}
                >
                  <IconX width={14} height={14} />
                </button>
              )}
            </label>
          </form>

          <div className="mb-7">
            <h2 className="mb-3 text-[12px] tracking-[0.2em] text-gold">{t('shop.category')}</h2>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => set('category', '')} className={chip(!category)}>
                {t('shop.all')}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => set('category', c.slug === category ? '' : c.slug)}
                  className={chip(c.slug === category)}
                >
                  {tf(c)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-7">
            <h2 className="mb-3 text-[12px] tracking-[0.2em] text-gold">{t('shop.brand')}</h2>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => set('brand', '')} className={chip(!brand)}>
                {t('shop.all')}
              </button>
              {BRANDS.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => set('brand', b.slug === brand ? '' : b.slug)}
                  className={chip(b.slug === brand)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-7">
            <h2 className="mb-3 flex items-baseline justify-between text-[12px] tracking-[0.2em] text-gold">
              {t('shop.price')}
              <span className="display text-[17px] text-chalk">€{maxPrice}</span>
            </h2>
            <input
              type="range"
              min="10"
              max={PRICE_MAX}
              step="5"
              value={maxPrice}
              onChange={(e) => set('max', e.target.value === String(PRICE_MAX) ? '' : e.target.value)}
              className="w-full accent-[var(--color-brand)]"
              aria-label={t('shop.price')}
            />
          </div>

          {active && (
            <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className={btn.smallGhost}>
              <IconX width={13} height={13} /> {t('shop.clear')}
            </button>
          )}
        </aside>

        {/* ---------------------------------------------------------- grid */}
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {SORTS.map((s) => (
                <button key={s} type="button" onClick={() => set('sort', s)} className={chip(s === sort)}>
                  {t(`shop.sort.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-[14px] border border-line bg-ink-2 p-14 text-center">
              <p className="text-[15px] text-muted">{t('shop.empty')}</p>
              <button
                type="button"
                onClick={() => setParams(new URLSearchParams(), { replace: true })}
                className={`${btn.primary} mt-5`}
              >
                {t('shop.clear')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 8) * 55} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
