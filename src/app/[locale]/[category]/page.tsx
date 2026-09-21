/* Category listing — /en/men. Lists the category and its subcategories. */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BRAND, isLocale, type Locale } from '@/config/brand'
import { getCategoryBySlug, listProducts, t as tr } from '@/lib/catalog'
import { productQuerySchema } from '@/lib/validation'
import { ProductListingView } from '@/components/ProductListingView'

type Props = {
  params: Promise<{ locale: string; category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, category: slug } = await params
  const locale = (isLocale(raw) ? raw : BRAND.market.defaultLocale) as Locale
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Not found' }

  const name = tr(category.name, locale)
  return {
    title: tr(category.seoTitle, locale) || name,
    description: tr(category.seoDescription, locale) || `Shop ${name} at ${BRAND.name}.`,
    alternates: { canonical: `/${locale}/${slug}` },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale: raw, category: slug } = await params
  const sp = await searchParams
  const locale = (isLocale(raw) ? raw : BRAND.market.defaultLocale) as Locale

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const query = productQuerySchema.parse({
    ...sp,
    sizes: typeof sp.sizes === 'string' ? sp.sizes.split(',').filter(Boolean) : sp.sizes,
    category: slug,
    locale,
  })

  const listing = await listProducts(query)

  return (
    <ProductListingView
      locale={locale}
      title={tr(category.name, locale)}
      listing={listing}
      query={query}
      basePath={`/${locale}/${slug}`}
    />
  )
}
