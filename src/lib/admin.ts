/* ============================================================================
 * ADMIN — the guard, and the reads each screen needs.
 *
 * One rule, in one place: `guardAdmin()` is the first line of every admin page
 * and every admin API route. It is impossible to add a screen and forget the
 * check without also forgetting to fetch the data, because the data comes from
 * here too.
 *
 * A signed-in customer who guesses /admin gets the 404 page, not "forbidden".
 * Telling them the route exists is an invitation.
 * ========================================================================== */

import { notFound, redirect } from 'next/navigation'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  categories,
  inventory,
  productVariants,
  products,
  promoCodes,
  promotions,
  users,
} from '@/db/schema'
import { AuthError, getCurrentUser, type SessionUser } from '@/lib/auth/session'
import type { UserRole } from '@/db/schema'
import { compareSizes } from '@/lib/sizes'

/* ------------------------------------------------------------------ guard -- */

/**
 * For PAGES. Sends a signed-out visitor to sign in (and back here afterwards);
 * shows a signed-in customer the 404 page.
 */
export async function guardAdmin(
  next = '/admin',
  minimum: UserRole = 'ADMIN',
): Promise<SessionUser> {
  const user = await getCurrentUser()

  if (!user) redirect(`/en/sign-in?next=${encodeURIComponent(next)}`)
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') notFound()
  if (minimum === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') notFound()

  return user
}

/**
 * For API ROUTES, which must answer with a status rather than a rendered page.
 * Returns the user, or a Response to send back untouched.
 */
export async function requireAdminApi(
  minimum: UserRole = 'ADMIN',
): Promise<{ user: SessionUser } | { response: Response }> {
  const user = await getCurrentUser()

  /* 404 for everyone who should not be here — signed out or merely a customer.
     A 401 would confirm the endpoint exists. */
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { response: Response.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 }) }
  }
  if (minimum === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
    return {
      response: Response.json(
        { ok: false, error: 'FORBIDDEN', message: 'This action needs a super-admin account.' },
        { status: 403 },
      ),
    }
  }
  return { user }
}

export { AuthError }

/* ----------------------------------------------------------- the overview -- */

export type AdminOverview = {
  products: { total: number; active: number }
  variants: number
  stock: { units: number; held: number; outOfStock: number; low: number }
  customers: number
  promotions: number
  promoCodes: number
  lowStock: {
    variantId: string
    sku: string
    size: string
    productName: Record<string, string>
    productSlug: string
    available: number
    onHand: number
  }[]
}

export async function getOverview(lowStockThreshold: number): Promise<AdminOverview> {
  const [productCounts] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${products.isActive})`.mapWith(Number),
    })
    .from(products)

  const [variantCount] = await db.select({ n: count() }).from(productVariants)

  const [stock] = await db
    .select({
      units: sql<number>`coalesce(sum(${inventory.onHand}), 0)`.mapWith(Number),
      held: sql<number>`coalesce(sum(${inventory.reserved}), 0)`.mapWith(Number),
      outOfStock: sql<number>`count(*) filter (where ${inventory.onHand} - ${inventory.reserved} <= 0)`.mapWith(
        Number,
      ),
      low: sql<number>`count(*) filter (where ${inventory.onHand} - ${inventory.reserved} > 0
                        and ${inventory.onHand} - ${inventory.reserved} <= ${lowStockThreshold})`.mapWith(
        Number,
      ),
    })
    .from(inventory)

  const [customerCount] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.role, 'CUSTOMER'))

  const [promotionCount] = await db
    .select({ n: count() })
    .from(promotions)
    .where(eq(promotions.isActive, true))

  const [codeCount] = await db
    .select({ n: count() })
    .from(promoCodes)
    .where(eq(promoCodes.isActive, true))

  /* What the shop needs to act on today: what is nearly gone. */
  const lowStock = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      productName: products.name,
      productSlug: products.slug,
      onHand: inventory.onHand,
      available: sql<number>`${inventory.onHand} - ${inventory.reserved}`.mapWith(Number),
    })
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(sql`${inventory.onHand} - ${inventory.reserved} <= ${lowStockThreshold}`)
    .orderBy(sql`${inventory.onHand} - ${inventory.reserved} asc`)
    .limit(25)

  return {
    products: { total: productCounts?.total ?? 0, active: productCounts?.active ?? 0 },
    variants: variantCount?.n ?? 0,
    stock: {
      units: stock?.units ?? 0,
      held: stock?.held ?? 0,
      outOfStock: stock?.outOfStock ?? 0,
      low: stock?.low ?? 0,
    },
    customers: customerCount?.n ?? 0,
    promotions: promotionCount?.n ?? 0,
    promoCodes: codeCount?.n ?? 0,
    lowStock,
  }
}

/* -------------------------------------------------------------- products -- */

export type AdminProductRow = {
  id: string
  slug: string
  name: Record<string, string>
  categoryName: Record<string, string>
  priceCents: number
  salePriceCents: number | null
  isActive: boolean
  variants: number
  available: number
}

export async function listAdminProducts(search?: string): Promise<AdminProductRow[]> {
  const where = search?.trim()
    ? sql`(${products.slug} ilike ${'%' + search.trim() + '%'}
           or ${products.name}->>'en' ilike ${'%' + search.trim() + '%'})`
    : undefined

  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      categoryName: categories.name,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
      isActive: products.isActive,
      variants: sql<number>`count(${productVariants.id})`.mapWith(Number),
      available: sql<number>`coalesce(sum(${inventory.onHand} - ${inventory.reserved}), 0)`.mapWith(
        Number,
      ),
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(where)
    .groupBy(products.id, categories.id)
    .orderBy(desc(products.createdAt))
}

export type AdminProductDetail = AdminProductRow & {
  summary: Record<string, string> | null
  description: Record<string, string> | null
  currency: string
  variants: never
  rows: {
    variantId: string
    sku: string
    size: string
    colorName: Record<string, string> | null
    onHand: number
    reserved: number
    available: number
    isActive: boolean
  }[]
}

export async function getAdminProduct(id: string) {
  const [row] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      summary: products.summary,
      description: products.description,
      categoryName: categories.name,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
      isActive: products.isActive,
      currency: products.currency,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.id, id))
    .limit(1)

  if (!row) return null

  const variants = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      colorName: productVariants.colorName,
      isActive: productVariants.isActive,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      available: sql<number>`${inventory.onHand} - ${inventory.reserved}`.mapWith(Number),
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.productId, id))
    .orderBy(productVariants.position)

  return {
    ...row,
    rows: variants
      .map((v) => ({
        ...v,
        onHand: v.onHand ?? 0,
        reserved: v.reserved ?? 0,
        available: v.available ?? 0,
      }))
      .sort((a, b) => compareSizes(a.size, b.size)),
  }
}

/* ----------------------------------------------------------------- stock -- */

export type StockRow = {
  variantId: string
  sku: string
  size: string
  productId: string
  productName: Record<string, string>
  productSlug: string
  categoryName: Record<string, string>
  onHand: number
  reserved: number
  available: number
}

export async function listStock(opts: { lowOnly?: boolean; threshold?: number } = {}) {
  const conditions = []
  if (opts.lowOnly) {
    conditions.push(
      sql`${inventory.onHand} - ${inventory.reserved} <= ${opts.threshold ?? 3}`,
    )
  }

  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      categoryName: categories.name,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      available: sql<number>`${inventory.onHand} - ${inventory.reserved}`.mapWith(Number),
      position: productVariants.position,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(products.slug, productVariants.position)

  return rows
}
