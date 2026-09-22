/* ============================================================================
 * Stock, every size in the shop on one screen.
 *
 * Grouped by product, because that is how a shop counts: you have the hoodies
 * in front of you, and you fill in all six sizes.
 * ========================================================================== */

import Link from 'next/link'
import { guardAdmin, listStock } from '@/lib/admin'
import { getSettings } from '@/lib/settings'
import { tField as tr } from '@/i18n/field'
import { StockEditor } from '@/components/admin/StockEditor'
import { Empty, PageHead } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  await guardAdmin('/admin/stock')
  const { filter } = await searchParams
  const lowOnly = filter === 'low'

  const settings = await getSettings(['low_stock_threshold', 'reservation_ttl_seconds'])
  const rows = await listStock({ lowOnly, threshold: settings.low_stock_threshold })

  /* Group into products, preserving the order the query returned. */
  const groups = new Map<
    string,
    { productId: string; name: Record<string, string>; slug: string; category: Record<string, string>; lines: typeof rows }
  >()
  for (const row of rows) {
    const existing = groups.get(row.productId)
    if (existing) existing.lines.push(row)
    else
      groups.set(row.productId, {
        productId: row.productId,
        name: row.productName,
        slug: row.productSlug,
        category: row.categoryName,
        lines: [row],
      })
  }

  return (
    <>
      <PageHead
        title="Stock"
        sub={
          lowOnly
            ? `Showing only sizes with ${settings.low_stock_threshold} or fewer available.`
            : 'Type the number on the shelf and press Enter. It saves as you go.'
        }
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/stock"
              className={`border px-4 py-2.5 label ${
                lowOnly ? 'border-line text-muted hover:border-ink' : 'border-ink bg-ink text-paper'
              }`}
            >
              Everything
            </Link>
            <Link
              href="/admin/stock?filter=low"
              className={`border px-4 py-2.5 label ${
                lowOnly ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:border-ink'
              }`}
            >
              Low & sold out
            </Link>
          </div>
        }
      />

      {groups.size === 0 ? (
        <Empty>
          {lowOnly
            ? 'Nothing is low. Every size has stock.'
            : 'No stock rows yet — seed the catalogue first.'}
        </Empty>
      ) : (
        <div className="space-y-10">
          {[...groups.values()].map((group) => (
            <section key={group.productId}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-lg font-semibold tracking-tight">{tr(group.name, 'en')}</h2>
                <span className="label text-muted">{tr(group.category, 'en')}</span>
                <Link
                  href={`/en/products/${group.slug}`}
                  className="ml-auto label text-muted hover:text-ink"
                >
                  View in shop
                </Link>
              </div>
              <StockEditor
                lines={group.lines.map((l) => ({
                  variantId: l.variantId,
                  sku: l.sku,
                  size: l.size,
                  onHand: l.onHand,
                  reserved: l.reserved,
                  available: l.available,
                }))}
                lowStockThreshold={settings.low_stock_threshold}
              />
            </section>
          ))}
        </div>
      )}
    </>
  )
}
