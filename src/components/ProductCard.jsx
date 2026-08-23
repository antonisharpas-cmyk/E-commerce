import { Link } from 'react-router-dom'
import { brandOf } from '../lib/catalog'
import { money, useI18n } from '../lib/i18n'
import { useCart } from '../lib/cart'
import ProductArt from './ProductArt'
import { IconCart } from './Icons'
import { Pill, Rating } from './ui'

export default function ProductCard({ product, compact = false }) {
  const { t, tf } = useI18n()
  const cart = useCart()
  const brand = brandOf(product.brand)
  const off = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-ink-2 transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_24px_60px_-28px_rgba(0,197,102,.45)]">
      {/* badges */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
        {off > 0 && <Pill tone="gold">−{off}%</Pill>}
        {product.badges.filter((b) => b !== 'flash').slice(0, 1).map((b) => (
          <Pill key={b} tone="brand">
            {t(`badge.${b}`)}
          </Pill>
        ))}
      </div>

      <Link
        to={`/product/${product.id}`}
        className="relative block overflow-hidden bg-gradient-to-b from-ink-3 to-ink-2"
        aria-label={product.name}
      >
        <ProductArt
          product={product}
          className="mx-auto h-44 w-full transition-transform duration-500 group-hover:scale-[1.07] sm:h-52"
        />
        <span className="absolute inset-x-0 bottom-0 h-px bg-line" />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10.5px] font-bold tracking-[0.2em] text-brand uppercase">{brand?.name}</p>
        <h3 className="mt-1.5 font-sans text-[14px] leading-snug font-semibold normal-case tracking-normal text-chalk">
          <Link to={`/product/${product.id}`} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>

        {!compact && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{tf(product)}</p>
        )}

        <Rating value={product.rating} count={product.reviews} label={`(${product.reviews})`} className="mt-3" />

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {product.oldPrice && (
              <span className="mr-2 text-[12px] text-muted line-through">{money(product.oldPrice)}</span>
            )}
            <span className="display text-[24px] text-gold">{money(product.price)}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              cart.add(product.id, {
                size: product.sizes[0],
                flavour: product.flavours[0],
              })
            }
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-ink transition-all hover:bg-[#00e076] hover:shadow-[0_8px_24px_-8px_rgba(0,197,102,.9)] active:scale-95"
            aria-label={`${t('p.add')} — ${product.name}`}
            title={t('p.add')}
          >
            <IconCart width={18} height={18} />
          </button>
        </div>
      </div>
    </article>
  )
}
