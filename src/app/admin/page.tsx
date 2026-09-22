/* ============================================================================
 * The overview.
 *
 * Answers the two questions a shop owner opens this page with: is anything
 * about to sell out, and is anything already sold out. Everything else is
 * context.
 *
 * "Held" is the number of units sitting in live customer carts. It is not a
 * problem — it is the reservation system doing its job — but it explains why
 * available is lower than the physical count, which is otherwise the sort of
 * discrepancy that makes people distrust a system.
 * ========================================================================== */

import Link from 'next/link'
import { guardAdmin, getOverview } from '@/lib/admin'
import { getSettings } from '@/lib/settings'
import { tField as tr } from '@/i18n/field'
import { Empty, PageHead, Pill, Stat, Table } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const user = await guardAdmin()
  const settings = await getSettings(['low_stock_threshold', 'reservation_ttl_seconds'])
  const overview = await getOverview(settings.low_stock_threshold)

  return (
    <>
      <PageHead
        title={`Good to see you, ${user.firstName}`}
        sub="Everything that needs attention, first."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Out of stock"
          value={overview.stock.outOfStock}
          tone={overview.stock.outOfStock > 0 ? 'bad' : 'plain'}
          href="/admin/stock?filter=low"
        />
        <Stat
          label={`Low stock (≤ ${settings.low_stock_threshold})`}
          value={overview.stock.low}
          tone={overview.stock.low > 0 ? 'warn' : 'plain'}
          href="/admin/stock?filter=low"
        />
        <Stat label="Units on the shelf" value={overview.stock.units} href="/admin/stock" />
        <Stat
          label="Held in carts now"
          value={overview.stock.held}
          href="/admin/stock"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Products"
          value={`${overview.products.active} / ${overview.products.total}`}
          href="/admin/products"
        />
        <Stat label="Sizes & colours" value={overview.variants} href="/admin/stock" />
        <Stat label="Customers" value={overview.customers} />
        <Stat
          label="Live promotions"
          value={`${overview.promotions} + ${overview.promoCodes} codes`}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Needs restocking</h2>

        {overview.lowStock.length === 0 ? (
          <Empty>Nothing is low. Every size has more than {settings.low_stock_threshold} available.</Empty>
        ) : (
          <Table head={['Product', 'Size', 'SKU', 'On shelf', 'Held', 'Available', '']}>
            {overview.lowStock.map((row) => (
              <tr key={row.variantId}>
                <td className="px-4 py-3">
                  <Link href={`/en/products/${row.productSlug}`} className="hover:underline">
                    {tr(row.productName, 'en')}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.size}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.sku}</td>
                <td className="px-4 py-3 tabular-nums">{row.onHand}</td>
                {/* Without this column, "1 on shelf — sold out" reads like a
                    bug. With it, the arithmetic is on the screen. */}
                <td className="px-4 py-3 tabular-nums text-muted">{row.onHand - row.available}</td>
                <td className="px-4 py-3">
                  {row.available <= 0 ? (
                    <Pill tone="bad">Sold out</Pill>
                  ) : (
                    <Pill tone="warn">{row.available} left</Pill>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href="/admin/stock?filter=low" className="label text-muted hover:text-ink">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted">
        Stock held in a cart is returned to the shelf automatically after{' '}
        {Math.round(settings.reservation_ttl_seconds / 60)} minutes if the customer does not
        check out. You do not need to do anything about it — and you cannot set a size below
        the number currently held, because those units are already promised.
      </p>
    </>
  )
}
