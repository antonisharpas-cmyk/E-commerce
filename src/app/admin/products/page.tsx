/* The catalogue: what is live, what it costs, how much of it there is. */

import Link from 'next/link'
import { guardAdmin, listAdminProducts } from '@/lib/admin'
import { getSettings } from '@/lib/settings'
import { formatMoney } from '@/lib/pricing'
import { tField as tr } from '@/i18n/field'
import { Empty, PageHead, Pill, Table } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await guardAdmin('/admin/products')
  const { q } = await searchParams
  const [rows, settings] = await Promise.all([
    listAdminProducts(q),
    getSettings(['low_stock_threshold']),
  ])

  return (
    <>
      <PageHead
        title="Products"
        sub={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
        action={
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search name or slug"
              aria-label="Search products"
              className="border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
            <button type="submit" className="border border-ink bg-ink px-4 py-2.5 label text-paper">
              Search
            </button>
          </form>
        }
      />

      {rows.length === 0 ? (
        <Empty>{q ? `Nothing matches “${q}”.` : 'No products yet.'}</Empty>
      ) : (
        <Table head={['Product', 'Category', 'Price', 'Sizes', 'Available', 'Status', '']}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/products/${row.id}`} className="font-medium hover:underline">
                  {tr(row.name, 'en')}
                </Link>
                <span className="block font-mono text-xs text-muted">{row.slug}</span>
              </td>
              <td className="px-4 py-3 text-muted">{tr(row.categoryName, 'en')}</td>
              <td className="px-4 py-3 tabular-nums">
                {row.salePriceCents ? (
                  <>
                    <span className="text-sale">{formatMoney(row.salePriceCents, 'en')}</span>
                    <span className="ml-2 text-xs text-muted line-through">
                      {formatMoney(row.priceCents, 'en')}
                    </span>
                  </>
                ) : (
                  formatMoney(row.priceCents, 'en')
                )}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">{row.variants}</td>
              <td className="px-4 py-3">
                {row.available <= 0 ? (
                  <Pill tone="bad">Sold out</Pill>
                ) : row.available <= settings.low_stock_threshold ? (
                  <Pill tone="warn">{row.available}</Pill>
                ) : (
                  <span className="tabular-nums">{row.available}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {row.isActive ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill>}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/products/${row.id}`} className="label text-muted hover:text-ink">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  )
}
