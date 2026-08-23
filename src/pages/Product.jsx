import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PRODUCTS, brandOf, bySlug, categoryOf } from '../lib/catalog'
import { money, useI18n } from '../lib/i18n'
import { useCart } from '../lib/cart'
import { SHOP } from '../lib/shop'
import ProductArt from '../components/ProductArt'
import ProductCard from '../components/ProductCard'
import { Pill, Rating, Reveal, SectionHead, btn } from '../components/ui'
import { IconArrow, IconCheck, IconPin, IconShield, IconTruck } from '../components/Icons'

export default function Product() {
  const { id } = useParams()
  const { t, tf } = useI18n()
  const cart = useCart()
  const product = bySlug(id)

  const [size, setSize] = useState('')
  const [flavour, setFlavour] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setSize(product?.sizes[0] ?? '')
    setFlavour(product?.flavours[0] ?? '')
    setQty(1)
    setAdded(false)
  }, [id, product])

  const related = useMemo(() => {
    if (!product) return []
    const same = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id)
    const others = PRODUCTS.filter((p) => p.category !== product.category && p.badges.includes('bestseller'))
    return [...same, ...others].slice(0, 4)
  }, [product])

  if (!product) {
    return (
      <div className="container-x flex flex-col items-center py-28 text-center">
        <h1 className="text-[2.4rem]">{t('p.notFound')}</h1>
        <Link to="/shop" className={`${btn.primary} mt-6`}>
          {t('p.back')}
        </Link>
      </div>
    )
  }

  const brand = brandOf(product.brand)
  const cat = categoryOf(product.category)
  const off = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

  const chip = (on) =>
    `rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
      on ? 'border-brand bg-brand text-ink' : 'border-line text-muted hover:border-brand hover:text-brand'
    }`

  return (
    <div className="container-x py-10">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <Link to="/" className="hover:text-brand">
          {t('nav.home')}
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand">
          {t('nav.shop')}
        </Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category}`} className="hover:text-brand">
          {tf(cat)}
        </Link>
      </nav>

      <div className="mt-7 grid gap-10 lg:grid-cols-2">
        {/* -------------------------------------------------------- gallery */}
        <div className="relative overflow-hidden rounded-[18px] border border-line bg-gradient-to-b from-ink-3 to-ink-2">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <span className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/10 blur-[80px]" />
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {off > 0 && <Pill tone="gold">−{off}%</Pill>}
            {product.badges.map((b) => (
              <Pill key={b} tone="brand">
                {t(`badge.${b}`)}
              </Pill>
            ))}
          </div>
          <ProductArt product={product} className="relative mx-auto h-[420px] w-full sm:h-[500px]" />
        </div>

        {/* ---------------------------------------------------------- panel */}
        <div>
          <Link
            to={`/shop?brand=${product.brand}`}
            className="text-[11.5px] font-bold tracking-[0.22em] text-brand uppercase hover:text-gold"
          >
            {brand?.name} {brand?.tag && <span className="text-muted normal-case">· {brand.tag}</span>}
          </Link>

          <h1 className="mt-3 font-sans text-[clamp(1.6rem,3.6vw,2.4rem)] leading-tight font-extrabold normal-case tracking-tight">
            {product.name}
          </h1>

          <div className="mt-3.5 flex items-center gap-3">
            <Rating value={product.rating} count={product.reviews} label={t('p.reviews', { n: product.reviews })} />
            <span className="text-[12px] text-muted">·</span>
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand">
              <IconCheck width={15} height={15} />
              {product.stock <= 8 ? t('p.lowStock', { n: product.stock }) : t('p.inStock')}
            </span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="display text-[clamp(2.4rem,5vw,3.2rem)] text-gold">{money(product.price)}</span>
            {product.oldPrice && (
              <span className="pb-2 text-[16px] text-muted line-through">{money(product.oldPrice)}</span>
            )}
          </div>

          <p className="mt-5 text-[14.5px] leading-relaxed text-muted">{tf(product)}</p>

          {/* macros */}
          {product.macro && (
            <div className="mt-6 grid grid-cols-4 gap-2 rounded-xl border border-line bg-ink-2 p-4">
              {[
                [t('p.protein'), `${product.macro.protein}g`],
                [t('p.carbs'), `${product.macro.carbs}g`],
                [t('p.fat'), `${product.macro.fat}g`],
                [t('p.serving'), `${product.macro.serving}g`],
              ].map(([k, v]) => (
                <div key={k} className="text-center">
                  <p className="display text-[19px] text-chalk">{v}</p>
                  <p className="mt-0.5 text-[10px] font-bold tracking-[0.1em] text-muted uppercase">{k}</p>
                </div>
              ))}
            </div>
          )}

          {/* options */}
          {product.sizes.length > 1 && (
            <div className="mt-6">
              <p className="mb-2.5 text-[11px] font-bold tracking-[0.2em] text-gold uppercase">{t('p.size')}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} type="button" onClick={() => setSize(s)} className={chip(s === size)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.flavours.length > 1 && (
            <div className="mt-5">
              <p className="mb-2.5 text-[11px] font-bold tracking-[0.2em] text-gold uppercase">{t('p.flavour')}</p>
              <div className="flex flex-wrap gap-2">
                {product.flavours.map((f) => (
                  <button key={f} type="button" onClick={() => setFlavour(f)} className={chip(f === flavour)}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* add to cart */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center rounded-full border border-line">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-12 w-11 place-items-center text-muted hover:text-brand"
                aria-label="−"
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="grid h-12 w-11 place-items-center text-muted hover:text-brand"
                aria-label="+"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                cart.add(product.id, { size, flavour, qty })
                setAdded(true)
              }}
              className={`${btn.primary} h-12 flex-1 sm:flex-none sm:px-10`}
            >
              {added ? (
                <>
                  <IconCheck width={17} height={17} /> {t('p.added')}
                </>
              ) : (
                <>
                  {t('p.add')} — {money(product.price * qty)}
                </>
              )}
            </button>
          </div>

          {/* trust row */}
          <ul className="mt-7 space-y-2.5 border-t border-line pt-6 text-[13px]">
            {[
              [IconPin, t('p.pickup')],
              [IconTruck, t('p.delivery')],
              [IconShield, t('p.authentic')],
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-2.5 text-muted">
                <Icon width={17} height={17} className="shrink-0 text-brand" />
                {label}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[12px] text-muted">
            {SHOP.addressShort} ·{' '}
            <a href={`tel:${SHOP.phoneRaw}`} className="text-brand hover:text-gold">
              {SHOP.phone}
            </a>
          </p>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-20">
          <SectionHead
            eyebrow={t('p.related')}
            title={t('p.related')}
            right={
              <Link to="/shop" className={btn.smallGhost}>
                {t('shop.all')} <IconArrow width={14} height={14} />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className="h-full">
                <ProductCard product={p} compact />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
