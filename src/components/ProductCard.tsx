import Link from 'next/link'
import type { Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { t as tr, type ProductCard as ProductCardData } from '@/lib/catalog'
import { Badge, Price, ProductImage } from './ui'

/* Section 5: image, name, price, sale price, discount %, sizes, availability. */
export function ProductCard({
  product,
  locale,
  priority = false,
}: {
  product: ProductCardData
  locale: Locale
  priority?: boolean
}) {
  const t = getTranslator(locale)
  const href = `/${locale}/products/${product.slug}`
  const image = product.images[0]

  return (
    <article className="group">
      <Link href={href} className="block">
        <div className="relative">
          <ProductImage
            src={image?.url ?? null}
            alt={tr(product.name, locale)}
            priority={priority}
          />

          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {product.isOnSale && product.discountPercent > 0 && (
              <Badge tone="sale">{t('card.saleBadge', { percent: product.discountPercent })}</Badge>
            )}
            {!product.inStock && <Badge tone="muted">{t('card.soldOut')}</Badge>}
          </div>
        </div>
      </Link>

      <div className="mt-3">
        <h3 className="text-sm leading-snug">
          <Link href={href} className="hover:underline">
            {tr(product.name, locale)}
          </Link>
        </h3>

        <div className="mt-1.5">
          <Price
            listCents={product.listCents}
            finalCents={product.finalCents}
            locale={locale}
            size="sm"
          />
        </div>

        {/* Size availability at a glance — sold-out sizes are struck through
            rather than hidden, so the customer can see the run is incomplete. */}
        {product.sizes.length > 1 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t('list.size')}>
            {product.sizes
              /* One entry per size, even when several colours share it. */
              .filter(
                (s, i, arr) => arr.findIndex((other) => other.size === s.size) === i,
              )
              .map((s) => (
                <li
                  key={s.size}
                  className={`text-[11px] ${
                    s.available > 0 ? 'text-ink-soft' : 'text-line-strong line-through'
                  }`}
                >
                  {s.size}
                </li>
              ))}
          </ul>
        )}
      </div>
    </article>
  )
}
