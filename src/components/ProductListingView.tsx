/* ============================================================================
 * Shared listing chrome — spec section 5.
 *
 * Filters and sorting are plain links that change the URL, not client state.
 * Three reasons: a filtered view is shareable and bookmarkable, it works with
 * JavaScript disabled, and the browser back button behaves the way a shopper
 * expects. The cost is a server round trip per filter change, which for a
 * product grid is the right trade.
 * ========================================================================== */

import Link from 'next/link'
import type { Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { formatMoney } from '@/lib/pricing'
import type { ProductListing } from '@/lib/catalog'
import type { ProductQuery } from '@/lib/validation'
import { ProductCard } from './ProductCard'

function buildHref(
  basePath: string,
  query: ProductQuery,
  /* Numbers are allowed and stringified below — page and maxPrice are
     naturally numeric and forcing callers to String() them is noise. */
  patch: Partial<Record<string, string | string[] | number | undefined>>,
) {
  const params = new URLSearchParams()

  const merged: Record<string, unknown> = {
    q: query.q,
    sizes: query.sizes,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    onSale: query.onSale ? '1' : undefined,
    inStockOnly: query.inStockOnly ? '1' : undefined,
    sort: query.sort === 'newest' ? undefined : query.sort,
    page: query.page === 1 ? undefined : query.page,
    ...patch,
  }

  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
    } else {
      params.set(key, String(value))
    }
  }

  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function ProductListingView({
  locale,
  title,
  breadcrumb = [],
  listing,
  query,
  basePath,
}: {
  locale: Locale
  title: string
  breadcrumb?: { label: string; href: string }[]
  listing: ProductListing
  query: ProductQuery
  basePath: string
}) {
  const t = getTranslator(locale)
  const href = (patch: Parameters<typeof buildHref>[2]) => buildHref(basePath, query, patch)

  const sorts: { value: ProductQuery['sort']; label: string }[] = [
    { value: 'newest', label: t('list.sort.newest') },
    { value: 'price-asc', label: t('list.sort.priceAsc') },
    { value: 'price-desc', label: t('list.sort.priceDesc') },
    { value: 'name-asc', label: t('list.sort.nameAsc') },
    { value: 'popular', label: t('list.sort.popular') },
  ]

  const hasFilters =
    Boolean(query.sizes?.length) ||
    query.onSale ||
    query.inStockOnly ||
    query.maxPrice !== undefined

  const selectedSizes = query.sizes ?? []

  return (
    <div className="container-x py-8">
      {/* breadcrumb */}
      {breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex gap-2 text-xs text-muted">
          {breadcrumb.map((crumb) => (
            <span key={crumb.href} className="flex gap-2">
              <Link href={crumb.href} className="hover:underline">
                {crumb.label}
              </Link>
              <span aria-hidden>/</span>
            </span>
          ))}
          <span className="text-ink">{title}</span>
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">{t('list.results', { n: listing.total })}</p>
        </div>

        {/* sort */}
        <div className="flex flex-wrap gap-1.5">
          {sorts.map((option) => (
            <Link
              key={option.value}
              href={href({ sort: option.value, page: undefined })}
              aria-current={query.sort === option.value ? 'true' : undefined}
              className={`border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                query.sort === option.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink-soft hover:border-ink'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8 pt-7 lg:grid-cols-[13rem_1fr]">
        {/* ------------------------------------------------------ filters -- */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="label">{t('list.filters')}</h2>
            {hasFilters && (
              <Link
                href={buildHref(basePath, { ...query, sizes: [], sort: query.sort } as ProductQuery, {
                  sizes: undefined,
                  onSale: undefined,
                  inStockOnly: undefined,
                  maxPrice: undefined,
                  page: undefined,
                })}
                className="text-[11px] text-muted underline hover:text-ink"
              >
                {t('list.clearFilters')}
              </Link>
            )}
          </div>

          {/* sizes */}
          {listing.facets.sizes.length > 0 && (
            <fieldset className="mt-6">
              <legend className="label mb-2.5 text-muted">{t('list.size')}</legend>
              <div className="flex flex-wrap gap-1.5">
                {listing.facets.sizes.map((facet) => {
                  const active = selectedSizes.includes(facet.size)
                  const next = active
                    ? selectedSizes.filter((s) => s !== facet.size)
                    : [...selectedSizes, facet.size]
                  return (
                    <Link
                      key={facet.size}
                      href={href({ sizes: next, page: undefined })}
                      aria-pressed={active}
                      className={`min-w-11 border px-2.5 py-1.5 text-center text-xs transition-colors ${
                        active
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line hover:border-ink'
                      }`}
                    >
                      {facet.size}
                    </Link>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* price — a few sensible bands rather than a slider, because a
              slider needs JavaScript and a band is one click */}
          {listing.facets.priceRange.maxCents > 0 && (
            <fieldset className="mt-7">
              <legend className="label mb-2.5 text-muted">{t('list.price')}</legend>
              <ul className="space-y-1.5">
                {[2500, 5000, 7500, 10_000]
                  .filter((cap) => cap < listing.facets.priceRange.maxCents + 2500)
                  .map((cap) => (
                    <li key={cap}>
                      <Link
                        href={href({
                          maxPrice: query.maxPrice === cap ? undefined : cap,
                          page: undefined,
                        })}
                        className={`text-xs ${
                          query.maxPrice === cap ? 'font-semibold text-ink' : 'text-ink-soft hover:underline'
                        }`}
                      >
                        {t('list.maxPrice', { price: formatMoney(cap, locale) })}
                      </Link>
                    </li>
                  ))}
              </ul>
            </fieldset>
          )}

          {/* toggles */}
          <fieldset className="mt-7 space-y-2">
            <legend className="sr-only">Availability</legend>
            <Link
              href={href({ onSale: query.onSale ? undefined : '1', page: undefined })}
              className={`block text-xs ${
                query.onSale ? 'font-semibold text-ink' : 'text-ink-soft hover:underline'
              }`}
            >
              {query.onSale ? '✓ ' : ''}
              {t('list.onSaleOnly')}
            </Link>
            <Link
              href={href({ inStockOnly: query.inStockOnly ? undefined : '1', page: undefined })}
              className={`block text-xs ${
                query.inStockOnly ? 'font-semibold text-ink' : 'text-ink-soft hover:underline'
              }`}
            >
              {query.inStockOnly ? '✓ ' : ''}
              {t('list.inStockOnly')}
            </Link>
          </fieldset>
        </aside>

        {/* --------------------------------------------------------- grid -- */}
        <div>
          {listing.items.length === 0 ? (
            <div className="border border-line px-8 py-20 text-center">
              <p className="text-sm text-muted">{t('list.noResults')}</p>
              <Link
                href={basePath}
                className="mt-5 inline-block border border-ink px-5 py-2.5 label hover:bg-ink hover:text-paper"
              >
                {t('list.clearFilters')}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
                {listing.items.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    priority={i < 4}
                  />
                ))}
              </div>

              {/* pagination */}
              {listing.totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-12 flex items-center justify-between border-t border-line pt-6"
                >
                  {listing.page > 1 ? (
                    <Link href={href({ page: listing.page - 1 })} className="label hover:underline">
                      ← {t('list.previous')}
                    </Link>
                  ) : (
                    <span className="label text-line-strong">← {t('list.previous')}</span>
                  )}

                  <span className="text-xs text-muted">
                    {t('list.page', { page: listing.page, total: listing.totalPages })}
                  </span>

                  {listing.page < listing.totalPages ? (
                    <Link href={href({ page: listing.page + 1 })} className="label hover:underline">
                      {t('list.next')} →
                    </Link>
                  ) : (
                    <span className="label text-line-strong">{t('list.next')} →</span>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
