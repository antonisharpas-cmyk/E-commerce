import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BRANDS, CATEGORIES, PRODUCTS, bestsellers, bySlug, flashDeals } from '../lib/catalog'
import { money, useI18n } from '../lib/i18n'
import { useCart } from '../lib/cart'
import { SHOP } from '../lib/shop'
import ProductArt from '../components/ProductArt'
import ProductCard from '../components/ProductCard'
import { Pill, Rating, Reveal, SectionHead, btn } from '../components/ui'
import {
  IconArrow,
  IconClock,
  IconDumbbell,
  IconPin,
  IconShield,
  IconSpark,
  IconTag,
  IconTruck,
  IconWhatsApp,
} from '../components/Icons'

/* ---------------------------------------------------------------- hero ---- */
function Hero() {
  const { t } = useI18n()
  const heroProducts = ['on-gold-standard-whey', 'mp-creatine-500g', 'mutant-madness'].map(bySlug)

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <span className="pointer-events-none absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full bg-brand/12 blur-[120px]" />
      <span className="pointer-events-none absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-gold/8 blur-[120px]" />

      {/* giant ghost word — clipped to the bottom edge so it reads as texture */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[86px] overflow-hidden select-none lg:block"
      >
        <span className="display text-outline absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10.5vw] leading-none whitespace-nowrap opacity-70">
          FITNESS MANIACS
        </span>
      </span>

      <div className="container-x relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand-soft/50 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.2em] text-brand uppercase">
              <IconPin width={13} height={13} />
              {t('hero.eyebrow')}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-[clamp(3rem,8.4vw,6.4rem)]">
              <span className="block text-chalk">{t('hero.title.1')}</span>
              <span className="block text-brand">
                {t('hero.title.2')}
                <span className="text-gold">.</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-muted">{t('hero.sub')}</p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={btn.primary}>
                {t('hero.cta')} <IconArrow width={17} height={17} />
              </Link>
              <a href={SHOP.whatsapp} target="_blank" rel="noreferrer noopener" className={btn.ghost}>
                <IconWhatsApp width={17} height={17} /> {t('hero.cta2')}
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mt-11 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-7">
              {[
                [BRANDS.length + '+', t('hero.stat.brands')],
                ['600+', t('hero.stat.skus')],
                [String(new Date().getFullYear() - SHOP.founded), t('hero.stat.years')],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="display text-[clamp(1.9rem,4vw,2.6rem)] text-gold">{n}</dt>
                  <dd className="mt-1 text-[11.5px] leading-tight text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* product stage */}
        <Reveal delay={200} className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-[460px]">
            <span className="absolute inset-8 rounded-full border border-brand/25" />
            <span className="absolute inset-16 rounded-full border border-gold/15" />
            <span className="glow-brand absolute inset-24 rounded-full bg-brand/8" />
            {heroProducts.map((p, i) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className={[
                  'absolute transition-transform duration-500 hover:scale-105',
                  i === 0 && 'left-1/2 top-2 z-20 w-[56%] -translate-x-1/2 drop-shadow-[0_28px_50px_rgba(0,0,0,.85)]',
                  i === 1 && 'bottom-2 left-0 z-10 w-[42%] drop-shadow-[0_20px_40px_rgba(0,0,0,.8)]',
                  i === 2 && 'right-0 bottom-8 z-10 w-[40%] drop-shadow-[0_20px_40px_rgba(0,0,0,.8)]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <ProductArt product={p} className="h-full w-full" />
              </Link>
            ))}
            <span className="absolute top-6 right-2 z-30 rotate-6">
              <Pill tone="gold">{t('badge.bestseller')}</Pill>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- why us ----- */
function Why() {
  const { t } = useI18n()
  const items = [
    [IconShield, 'why.1'],
    [IconTruck, 'why.2'],
    [IconDumbbell, 'why.3'],
    [IconTag, 'why.4'],
  ]
  return (
    <section className="border-b border-line bg-ink-2/40">
      <div className="container-x py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([Icon, key], i) => (
            <Reveal key={key} delay={i * 90}>
              <div className="group h-full rounded-[14px] border border-line bg-ink-2 p-6 transition-colors hover:border-brand/45">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-ink">
                  <Icon width={21} height={21} />
                </span>
                <h3 className="mt-4 text-[17px]">{t(`${key}.t`)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{t(`${key}.d`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- categories ---- */
function Categories() {
  const { t, tf } = useI18n()
  const count = (slug) => PRODUCTS.filter((p) => p.category === slug).length

  return (
    <section className="container-x py-16">
      <SectionHead
        eyebrow={t('nav.categories')}
        title={t('sec.categories')}
        sub={t('sec.categories.sub')}
        right={
          <Link to="/shop" className={btn.smallGhost}>
            {t('shop.all')} <IconArrow width={14} height={14} />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <Reveal key={c.slug} delay={i * 40}>
            <Link
              to={`/shop?category=${c.slug}`}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[14px] border border-line bg-ink-2 p-5 transition-all hover:-translate-y-1 hover:border-brand/50"
            >
              <span className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <span className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                {count(c.slug)} {t('shop.results', { n: '' }).trim()}
              </span>
              <span className="mt-8 flex items-end justify-between gap-2">
                <span className="display text-[19px] leading-tight text-chalk transition-colors group-hover:text-brand">
                  {tf(c)}
                </span>
                <IconArrow
                  width={17}
                  height={17}
                  className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-brand"
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- flash ---- */
function useCountdown() {
  const target = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
    d.setHours(23, 59, 59, 0)
    return d
  }, [])
  const [left, setLeft] = useState(() => target - new Date())

  useEffect(() => {
    const id = setInterval(() => setLeft(target - new Date()), 1000)
    return () => clearInterval(id)
  }, [target])

  const s = Math.max(0, Math.floor(left / 1000))
  return [
    ['D', Math.floor(s / 86400)],
    ['H', Math.floor((s % 86400) / 3600)],
    ['M', Math.floor((s % 3600) / 60)],
    ['S', s % 60],
  ]
}

function Flash() {
  const { t } = useI18n()
  const deals = flashDeals()
  const clock = useCountdown()

  return (
    <section className="relative overflow-hidden border-y border-line bg-ink-2/50">
      <span className="pointer-events-none absolute top-0 left-1/3 h-64 w-64 rounded-full bg-gold/8 blur-[100px]" />
      <div className="container-x relative py-16">
        <SectionHead
          eyebrow={
            <>
              <IconSpark width={13} height={13} className="inline" /> {t('sec.flash')}
            </>
          }
          title={t('sec.flash')}
          sub={t('sec.flash.sub')}
          right={
            <div className="flex items-center gap-2">
              <IconClock width={17} height={17} className="text-gold" />
              {clock.map(([unit, v]) => (
                <span
                  key={unit}
                  className="flex min-w-[46px] flex-col items-center rounded-lg border border-line bg-ink px-2 py-1.5"
                >
                  <span className="display text-[19px] text-gold">{String(v).padStart(2, '0')}</span>
                  <span className="text-[9px] font-bold tracking-widest text-muted">{unit}</span>
                </span>
              ))}
            </div>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((p, i) => (
            <Reveal key={p.id} delay={i * 70} className="h-full">
              <ProductCard product={p} compact />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- stacks ---- */
const STACKS = [
  { key: 'stack.1', items: ['asl-beast-whey-2kg', 'mp-creatine-500g', 'universal-animal-pak'], tone: 'brand' },
  { key: 'stack.2', items: ['asl-isolate-90', 'lipo-6-black', 'activlab-iso-plus'], tone: 'gold' },
  { key: 'stack.3', items: ['asl-mass-gainer-5kg', 'universal-creatine', 'mutant-madness'], tone: 'brand' },
]

function Stacks() {
  const { t } = useI18n()
  const cart = useCart()

  return (
    <section className="container-x py-16">
      <SectionHead eyebrow={t('sec.stacks')} title={t('sec.stacks')} sub={t('sec.stacks.sub')} />
      <div className="grid gap-5 lg:grid-cols-3">
        {STACKS.map((s, i) => {
          const products = s.items.map(bySlug).filter(Boolean)
          const full = products.reduce((a, p) => a + p.price, 0)
          const bundle = Math.round(full * 0.88)
          const accent = s.tone === 'gold' ? 'text-gold' : 'text-brand'
          const ring = s.tone === 'gold' ? 'hover:border-gold/50' : 'hover:border-brand/50'

          return (
            <Reveal key={s.key} delay={i * 100}>
              <div
                className={`flex h-full flex-col rounded-[14px] border border-line bg-ink-2 p-6 transition-colors ${ring}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-[22px] ${accent}`}>{t(`${s.key}.t`)}</h3>
                  <Pill tone={s.tone === 'gold' ? 'gold' : 'brand'}>
                    {t('stack.save')} {money(full - bundle)}
                  </Pill>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{t(`${s.key}.d`)}</p>

                <div className="my-5 flex gap-2">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.id}`}
                      className="flex-1 overflow-hidden rounded-lg border border-line bg-ink transition-colors hover:border-brand/50"
                    >
                      <ProductArt product={p} className="h-24 w-full" />
                    </Link>
                  ))}
                </div>

                <ul className="space-y-1.5 text-[12.5px] text-muted">
                  {products.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 text-chalk/70">{money(p.price)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-5">
                  <div>
                    <span className="mr-2 text-[13px] text-muted line-through">{money(full)}</span>
                    <span className="display text-[28px] text-gold">{money(bundle)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      cart.addMany(products.map((p) => ({ id: p.id, size: p.sizes[0], flavour: p.flavours[0] })))
                    }
                    className={btn.small}
                  >
                    {t('stack.cta')}
                  </button>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* --------------------------------------------------------- bestsellers ---- */
function Best() {
  const { t } = useI18n()
  return (
    <section className="border-y border-line bg-ink-2/40">
      <div className="container-x py-16">
        <SectionHead
          eyebrow={t('sec.best')}
          title={t('sec.best')}
          sub={t('sec.best.sub')}
          right={
            <Link to="/shop?sort=rating" className={btn.smallGhost}>
              {t('shop.all')} <IconArrow width={14} height={14} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers()
            .slice(0, 4)
            .map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className="h-full">
                <ProductCard product={p} compact />
              </Reveal>
            ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- brands ---- */
function BrandStrip() {
  const { t } = useI18n()
  const row = [...BRANDS, ...BRANDS]
  return (
    <section className="py-16">
      <div className="container-x">
        <SectionHead eyebrow={t('sec.brands')} title={t('sec.brands')} sub={t('sec.brands.sub')} />
      </div>
      <div className="relative overflow-hidden border-y border-line py-7">
        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
        <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
        <div className="marquee-track">
          {row.map((b, i) => (
            <Link
              key={b.slug + i}
              to={`/shop?brand=${b.slug}`}
              className="display mx-8 shrink-0 text-[26px] whitespace-nowrap text-muted transition-colors hover:text-brand"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- reviews ---- */
function Reviews() {
  const { t } = useI18n()
  const rows = [
    ['rev.1', 'Andreas P.', 'Larnaca'],
    ['rev.2', 'Maria K.', 'Aradippou'],
    ['rev.3', 'Christos M.', 'Meneou'],
  ]
  return (
    <section className="container-x py-16">
      <SectionHead eyebrow={t('sec.reviews')} title={t('sec.reviews')} />
      <div className="grid gap-5 md:grid-cols-3">
        {rows.map(([key, name, place], i) => (
          <Reveal key={key} delay={i * 100}>
            <figure className="flex h-full flex-col rounded-[14px] border border-line bg-ink-2 p-6">
              <Rating value={5} />
              <blockquote className="mt-4 flex-1 text-[14px] leading-relaxed text-chalk/90">“{t(key)}”</blockquote>
              <figcaption className="mt-5 text-[12px] text-muted">
                <span className="font-semibold text-chalk">{name}</span> · {place}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- visit ---- */
function Visit() {
  const { t } = useI18n()
  return (
    <section className="container-x pb-4">
      <Reveal>
        <div className="relative overflow-hidden rounded-[18px] border border-line bg-ink-2">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
          <span className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand/12 blur-[90px]" />
          <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-brand uppercase">
                <span className="h-px w-7 bg-brand" />
                {t('sec.visit')}
              </p>
              <h2 className="text-[clamp(1.9rem,4.4vw,3rem)]">{t('contact.title')}</h2>
              <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">{t('contact.sub')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={SHOP.maps} target="_blank" rel="noreferrer noopener" className={btn.gold}>
                  <IconPin width={16} height={16} /> {t('contact.directions')}
                </a>
                <Link to="/contact" className={btn.ghost}>
                  {t('nav.contact')}
                </Link>
              </div>
            </div>
            <dl className="space-y-4 rounded-2xl border border-line bg-ink/70 p-6 text-[13.5px]">
              <div>
                <dt className="text-[10.5px] font-bold tracking-[0.2em] text-brand uppercase">
                  {t('contact.address')}
                </dt>
                <dd className="mt-1 text-chalk">{SHOP.address}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold tracking-[0.2em] text-brand uppercase">
                  {t('contact.hours')}
                </dt>
                <dd className="mt-1 space-y-0.5 text-muted">
                  <p>
                    {t('contact.hours.week')} · <span className="text-chalk">{SHOP.hours.week}</span>
                  </p>
                  <p>
                    {t('contact.hours.sat')} · <span className="text-chalk">{SHOP.hours.sat}</span>
                  </p>
                  <p>
                    {t('contact.hours.sun')} · <span className="text-chalk">{t('contact.hours.closed')}</span>
                  </p>
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold tracking-[0.2em] text-brand uppercase">
                  {t('contact.phone')}
                </dt>
                <dd className="mt-1">
                  <a href={`tel:${SHOP.phoneRaw}`} className="text-chalk hover:text-brand">
                    {SHOP.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Why />
      <Categories />
      <Flash />
      <Stacks />
      <Best />
      <BrandStrip />
      <Reviews />
      <Visit />
    </>
  )
}
