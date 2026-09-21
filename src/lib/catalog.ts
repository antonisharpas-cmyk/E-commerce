/* ============================================================================
 * CATALOGUE QUERIES — spec sections 4, 5, 6, 7.
 *
 * Categories are read from the database, never hardcoded (section 4), so the
 * navigation is whatever the admin has configured.
 *
 * The listing query does filtering, sorting and pagination in SQL rather than
 * in JavaScript. Fetching every product and filtering in memory works fine with
 * the 30 products in the seed and falls over at 3,000.
 * ========================================================================== */

import { and, asc, desc, eq, exists, gte, inArray, isNotNull, lte, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  categories,
  inventory,
  productImages,
  productVariants,
  products,
  type Category,
} from '@/db/schema'
import {
  loadActivePromotions,
  promotionScope,
  resolvePrices,
  type EffectivePrice,
} from './pricing'
import { compareSizes, sortBySize, sortSizes } from './sizes'
import type { ProductQuery } from './validation'
import type { Locale } from '@/config/brand'

/* ------------------------------------------------------------ translation -- */

/* Re-exported for server components' convenience. The implementation lives in
   src/i18n/field.ts with no imports, so CLIENT components must import it from
   there — importing it from here would pull the `pg` driver into the browser
   bundle. */
import { tField } from '@/i18n/field'
export { tField as t }

/* -------------------------------------------------------------- navigation -- */

export type CategoryNode = Category & { children: Category[] }

/** The whole navigation tree in one query. Cached per request by Next. */
export async function getCategoryTree(includeInactive = false): Promise<CategoryNode[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(includeInactive ? undefined : eq(categories.isActive, true))
    .orderBy(asc(categories.position), asc(categories.slug))

  const roots = rows.filter((r) => r.parentId === null)
  return roots.map((root) => ({
    ...root,
    children: rows.filter((r) => r.parentId === root.id),
  }))
}

export async function getCategoryBySlug(
  slug: string,
  parentSlug?: string,
): Promise<Category | null> {
  if (parentSlug) {
    const [row] = await db
      .select({ child: categories })
      .from(categories)
      .innerJoin(
        sql`${categories} as parent`,
        sql`parent.id = ${categories.parentId} and parent.slug = ${parentSlug}`,
      )
      .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
      .limit(1)
    return row?.child ?? null
  }

  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1)
  return row ?? null
}

/** A category plus its descendants, so /men lists everything under Men. */
async function categoryAndDescendants(categoryId: string): Promise<string[]> {
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, categoryId))
  return [categoryId, ...children.map((c) => c.id)]
}

/* ---------------------------------------------------------------- listing -- */

export type ProductCard = {
  id: string
  slug: string
  name: Record<string, string>
  summary: Record<string, string> | null
  categoryId: string
  images: { url: string; alt: Record<string, string> | null }[]
  listCents: number
  finalCents: number
  discountPercent: number
  isOnSale: boolean
  /** Sizes with stock, and all sizes, so a card can grey out sold-out sizes. */
  sizes: { size: string; variantId: string; available: number }[]
  inStock: boolean
  createdAt: Date
}

export type ProductListing = {
  items: ProductCard[]
  total: number
  page: number
  perPage: number
  totalPages: number
  /** Facet data so the filter UI shows only options that exist. */
  facets: {
    sizes: { size: string; count: number }[]
    priceRange: { minCents: number; maxCents: number }
  }
}

export async function listProducts(query: ProductQuery): Promise<ProductListing> {
  const conditions = [eq(products.isActive, true)]

  /* --- category / subcategory --- */
  if (query.subcategory && query.category) {
    const sub = await getCategoryBySlug(query.subcategory, query.category)
    if (!sub) return emptyListing(query)
    conditions.push(eq(products.categoryId, sub.id))
  } else if (query.category) {
    const cat = await getCategoryBySlug(query.category)
    if (!cat) return emptyListing(query)
    const ids = await categoryAndDescendants(cat.id)
    conditions.push(inArray(products.categoryId, ids))
  }

  /* --- search (section 6: useful results without an exact name) --- */
  if (query.q) {
    const needle = query.q.trim()
    conditions.push(
      or(
        /* Full-text for whole words in any of the three languages. */
        sql`to_tsvector('simple', coalesce(${products.searchText}, '')) @@ plainto_tsquery('simple', ${needle})`,
        /* Trigram similarity for typos and partial words. */
        sql`coalesce(${products.searchText}, '') % ${needle}`,
        /* Substring, so "hood" matches "hoodie" even below the trigram cutoff. */
        sql`coalesce(${products.searchText}, '') ilike ${'%' + needle + '%'}`,
        /* SKU lookup, for staff and for customers reading a label. */
        exists(
          db
            .select({ one: sql`1` })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.productId, products.id),
                sql`${productVariants.sku} ilike ${'%' + needle + '%'}`,
              ),
            ),
        ),
      )!,
    )
  }

  /* --- price --- */
  if (query.minPrice !== undefined) {
    conditions.push(gte(sql`coalesce(${products.salePriceCents}, ${products.priceCents})`, query.minPrice))
  }
  if (query.maxPrice !== undefined) {
    conditions.push(lte(sql`coalesce(${products.salePriceCents}, ${products.priceCents})`, query.maxPrice))
  }

  /* --- on sale --- */
  /* "Reduced" means what a customer sees as reduced: a manual sale price OR an
     active promotion reaching this product. Filtering on salePriceCents alone
     hid every promotion-discounted product from the very filter meant to find
     it. */
  if (query.onSale) {
    const scope = await promotionScope()
    const reasons = [isNotNull(products.salePriceCents)]
    if (scope.everything) {
      /* Every product is discounted; the filter stops narrowing anything. */
      reasons.length = 0
    } else {
      if (scope.productIds.length) reasons.push(inArray(products.id, scope.productIds))
      if (scope.categoryIds.length) reasons.push(inArray(products.categoryId, scope.categoryIds))
    }
    if (reasons.length) conditions.push(or(...reasons)!)
  }

  /* --- sizes --- */
  /* Built with the query builder rather than raw SQL: a hand-written
     `size = any(${array})` makes Drizzle emit one placeholder per element,
     which Postgres reads as a tuple and rejects. inArray() binds it properly. */
  if (query.sizes?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, products.id),
              eq(productVariants.isActive, true),
              inArray(productVariants.size, query.sizes),
            ),
          ),
      ),
    )
  }

  /* --- availability --- */
  if (query.inStockOnly) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productVariants)
          .innerJoin(inventory, eq(inventory.variantId, productVariants.id))
          .where(
            and(
              eq(productVariants.productId, products.id),
              eq(productVariants.isActive, true),
              sql`${inventory.onHand} - ${inventory.reserved} > 0`,
            ),
          ),
      ),
    )
  }

  const where = and(...conditions)

  /* --- count for pagination --- */
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(products)
    .where(where)

  /* --- sort --- */
  const effectivePrice = sql`coalesce(${products.salePriceCents}, ${products.priceCents})`
  const orderBy =
    query.sort === 'price-asc'
      ? [asc(effectivePrice)]
      : query.sort === 'price-desc'
        ? [desc(effectivePrice)]
        : query.sort === 'name-asc'
          ? [asc(sql`${products.name}->>'en'`)]
          : query.sort === 'popular'
            ? [
                desc(
                  sql`(select count(*) from product_views pv where pv.product_id = ${products.id})`,
                ),
                desc(products.createdAt),
              ]
            : [desc(products.createdAt)]

  const offset = (query.page - 1) * query.perPage

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      summary: products.summary,
      categoryId: products.categoryId,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(where)
    .orderBy(...orderBy)
    .limit(query.perPage)
    .offset(offset)

  const items = await hydrateCards(rows)

  return {
    items,
    total,
    page: query.page,
    perPage: query.perPage,
    totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    facets: await loadFacets(where),
  }
}

function emptyListing(query: ProductQuery): ProductListing {
  return {
    items: [],
    total: 0,
    page: query.page,
    perPage: query.perPage,
    totalPages: 1,
    facets: { sizes: [], priceRange: { minCents: 0, maxCents: 0 } },
  }
}

/** Sizes and price range across the *filtered* set, so the facet counts match
 *  what the customer is looking at. */
async function loadFacets(where: ReturnType<typeof and>) {
  const sizeRows = await db
    .select({
      size: productVariants.size,
      count: sql<number>`count(distinct ${products.id})`.mapWith(Number),
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .where(and(where, eq(productVariants.isActive, true)))
    .groupBy(productVariants.size)

  const [range] = await db
    .select({
      minCents: sql<number>`coalesce(min(coalesce(${products.salePriceCents}, ${products.priceCents})), 0)`.mapWith(
        Number,
      ),
      maxCents: sql<number>`coalesce(max(coalesce(${products.salePriceCents}, ${products.priceCents})), 0)`.mapWith(
        Number,
      ),
    })
    .from(products)
    .where(where)

  /* SQL would sort these alphabetically — "L, M, One size, S, XL, XS". */
  return {
    sizes: sortBySize(sizeRows, (r) => r.size),
    priceRange: range ?? { minCents: 0, maxCents: 0 },
  }
}

/** Attach images, variants, stock and effective prices to a page of products.
 *  Three queries regardless of how many products — not one per product. */
async function hydrateCards(
  rows: {
    id: string
    slug: string
    name: Record<string, string>
    summary: Record<string, string> | null
    categoryId: string
    priceCents: number
    salePriceCents: number | null
    createdAt: Date
  }[],
): Promise<ProductCard[]> {
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)

  const [images, variants, promos] = await Promise.all([
    db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        alt: productImages.alt,
        position: productImages.position,
      })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.position)),

    db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        size: productVariants.size,
        position: productVariants.position,
        available: sql<number>`coalesce(${inventory.onHand} - ${inventory.reserved}, 0)`.mapWith(
          Number,
        ),
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(and(inArray(productVariants.productId, ids), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.position)),

    loadActivePromotions(),
  ])

  /* Price each product once, using its first variant as the representative —
     a card shows one price, and variant overrides are shown on the product
     page where the size is actually chosen. */
  const priceInputs = rows.map((r) => ({
    productId: r.id,
    categoryId: r.categoryId,
    variantId: r.id, // keyed by product for the card
    listCents: r.priceCents,
    saleCents: r.salePriceCents,
  }))
  const prices = await resolvePrices(priceInputs, promos)

  return rows.map((row) => {
    const price: EffectivePrice =
      prices.get(row.id) ??
      ({
        variantId: row.id,
        listCents: row.priceCents,
        finalCents: row.priceCents,
        discountCents: 0,
        discountPercent: 0,
        source: 'none',
        promotionId: null,
        promotionSnapshot: null,
      } satisfies EffectivePrice)

    const productVariantsForRow = variants.filter((v) => v.productId === row.id)

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      summary: row.summary,
      categoryId: row.categoryId,
      images: images
        .filter((i) => i.productId === row.id)
        .map((i) => ({ url: i.url, alt: i.alt })),
      listCents: price.listCents,
      finalCents: price.finalCents,
      discountPercent: price.discountPercent,
      isOnSale: price.discountCents > 0,
      sizes: sortBySize(
        productVariantsForRow.map((v) => ({
          size: v.size,
          variantId: v.id,
          available: v.available,
        })),
        (v) => v.size,
      ),
      inStock: productVariantsForRow.some((v) => v.available > 0),
      createdAt: row.createdAt,
    }
  })
}

/* ----------------------------------------------------------- product page -- */

export type ProductDetail = {
  id: string
  slug: string
  name: Record<string, string>
  description: Record<string, string> | null
  summary: Record<string, string> | null
  seoTitle: Record<string, string> | null
  seoDescription: Record<string, string> | null
  sizeGuide: Record<string, string> | null
  category: {
    id: string
    slug: string
    name: Record<string, string>
    parentSlug: string | null
    /* The parent's translated name, so a breadcrumb can read "Men / Hoodies"
       rather than printing the raw slug. */
    parentName: Record<string, string> | null
  }
  images: { url: string; alt: Record<string, string> | null; width: number | null; height: number | null }[]
  variants: {
    id: string
    sku: string
    size: string
    colorName: Record<string, string> | null
    colorHex: string | null
    listCents: number
    finalCents: number
    discountPercent: number
    available: number
    inStock: boolean
    isLowStock: boolean
  }[]
  listCents: number
  finalCents: number
  discountPercent: number
  inStock: boolean
  currency: string
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const [row] = await db
    .select({
      product: products,
      category: categories,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1)

  if (!row) return null

  const parent = row.category.parentId
    ? (
        await db
          .select({ slug: categories.slug, name: categories.name })
          .from(categories)
          .where(eq(categories.id, row.category.parentId))
          .limit(1)
      )[0] ?? null
    : null

  const [images, variantRows] = await Promise.all([
    db
      .select({
        url: productImages.url,
        alt: productImages.alt,
        width: productImages.width,
        height: productImages.height,
      })
      .from(productImages)
      .where(eq(productImages.productId, row.product.id))
      .orderBy(asc(productImages.position)),

    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        colorName: productVariants.colorName,
        colorHex: productVariants.colorHex,
        priceOverride: productVariants.priceCentsOverride,
        saleOverride: productVariants.salePriceCentsOverride,
        position: productVariants.position,
        onHand: inventory.onHand,
        reserved: inventory.reserved,
        lowStockThreshold: inventory.lowStockThreshold,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(and(eq(productVariants.productId, row.product.id), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.position)),
  ])

  /* Within one position the tie-break is the conventional size order, not the
     alphabetical one SQL would give. */
  variantRows.sort((a, b) => a.position - b.position || compareSizes(a.size, b.size))

  /* Price every variant, since a variant may override the product price. */
  const prices = await resolvePrices(
    variantRows.map((v) => ({
      productId: row.product.id,
      categoryId: row.product.categoryId,
      variantId: v.id,
      listCents: v.priceOverride ?? row.product.priceCents,
      saleCents: v.saleOverride ?? row.product.salePriceCents,
    })),
  )

  const variants = variantRows.map((v) => {
    const price = prices.get(v.id)
    const available = Math.max(0, (v.onHand ?? 0) - (v.reserved ?? 0))
    const threshold = v.lowStockThreshold ?? 3
    return {
      id: v.id,
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      colorHex: v.colorHex,
      listCents: price?.listCents ?? row.product.priceCents,
      finalCents: price?.finalCents ?? row.product.priceCents,
      discountPercent: price?.discountPercent ?? 0,
      available,
      inStock: available > 0,
      isLowStock: available > 0 && available <= threshold,
    }
  })

  /* The headline price is the cheapest in-stock variant, or the cheapest
     overall if everything is sold out. */
  const candidates = variants.filter((v) => v.inStock).length
    ? variants.filter((v) => v.inStock)
    : variants
  const headline = candidates.reduce(
    (best, v) => (v.finalCents < best.finalCents ? v : best),
    candidates[0] ?? { listCents: row.product.priceCents, finalCents: row.product.priceCents, discountPercent: 0 },
  )

  return {
    id: row.product.id,
    slug: row.product.slug,
    name: row.product.name,
    description: row.product.description,
    summary: row.product.summary,
    seoTitle: row.product.seoTitle,
    seoDescription: row.product.seoDescription,
    sizeGuide: row.product.sizeGuide,
    category: {
      id: row.category.id,
      slug: row.category.slug,
      name: row.category.name,
      parentSlug: parent?.slug ?? null,
      parentName: parent?.name ?? null,
    },
    images,
    variants,
    listCents: headline.listCents,
    finalCents: headline.finalCents,
    discountPercent: headline.discountPercent,
    inStock: variants.some((v) => v.inStock),
    currency: row.product.currency,
  }
}

/* -------------------------------------------------------------- discovery -- */

/** Section 7: related products. Same category first, newest first. */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductCard[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      summary: products.summary,
      categoryId: products.categoryId,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        eq(products.categoryId, categoryId),
        sql`${products.id} <> ${productId}`,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(limit)

  return hydrateCards(rows)
}

/** Autocomplete for the header search. Deliberately small and fast. */
export async function searchSuggestions(
  term: string,
  locale: Locale = 'en',
  limit = 6,
): Promise<{ slug: string; name: string; finalCents: number; imageUrl: string | null }[]> {
  const needle = term.trim()
  if (needle.length < 2) return []

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
      categoryId: products.categoryId,
      similarity: sql<number>`similarity(coalesce(${products.searchText}, ''), ${needle})`.mapWith(
        Number,
      ),
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(
          sql`coalesce(${products.searchText}, '') ilike ${'%' + needle + '%'}`,
          sql`coalesce(${products.searchText}, '') % ${needle}`,
        )!,
      ),
    )
    .orderBy(desc(sql`similarity(coalesce(${products.searchText}, ''), ${needle})`))
    .limit(limit)

  if (rows.length === 0) return []

  const images = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.id)))
    .orderBy(asc(productImages.position))
  const firstImage = new Map<string, string>()
  for (const i of images) if (!firstImage.has(i.productId)) firstImage.set(i.productId, i.url)

  const prices = await resolvePrices(
    rows.map((r) => ({
      productId: r.id,
      categoryId: r.categoryId,
      variantId: r.id,
      listCents: r.priceCents,
      saleCents: r.salePriceCents,
    })),
  )

  return rows.map((r) => ({
    slug: r.slug,
    name: tField(r.name, locale),
    finalCents: prices.get(r.id)?.finalCents ?? r.priceCents,
    imageUrl: firstImage.get(r.id) ?? null,
  }))
}

/** All distinct sizes in the catalogue, for the filter sidebar. */
export async function getAllSizes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ size: productVariants.size })
    .from(productVariants)
    .where(eq(productVariants.isActive, true))
  return sortSizes(rows.map((r) => r.size))
}
