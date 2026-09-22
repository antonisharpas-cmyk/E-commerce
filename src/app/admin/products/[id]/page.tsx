/* One product: price and visibility here, stock per size below. */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminProduct, guardAdmin } from '@/lib/admin'
import { getSettings } from '@/lib/settings'
import { tField as tr } from '@/i18n/field'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { StockEditor } from '@/components/admin/StockEditor'
import { PageHead, Pill } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await guardAdmin(`/admin/products/${id}`)

  const [product, settings] = await Promise.all([
    getAdminProduct(id),
    getSettings(['low_stock_threshold']),
  ])
  if (!product) notFound()

  return (
    <>
      <nav className="mb-5 flex gap-2 text-xs text-muted">
        <Link href="/admin/products" className="hover:underline">
          Products
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink">{tr(product.name, 'en')}</span>
      </nav>

      <PageHead
        title={tr(product.name, 'en')}
        sub={
          <>
            {tr(product.categoryName, 'en')} · <span className="font-mono">{product.slug}</span>{' '}
            {product.isActive ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill>}
          </>
        }
        action={
          <Link
            href={`/en/products/${product.slug}`}
            className="border border-line px-4 py-2.5 label text-muted hover:border-ink hover:text-ink"
          >
            View in shop
          </Link>
        }
      />

      <ProductEditor
        productId={product.id}
        priceCents={product.priceCents}
        salePriceCents={product.salePriceCents}
        isActive={product.isActive}
      />

      <section className="mt-12">
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Stock by size</h2>
        <p className="mb-4 text-sm text-muted">
          Type the number on the shelf and press Enter. Held units are in live customer carts and
          come back automatically if the customer does not check out.
        </p>
        <StockEditor
          lines={product.rows.map((r) => ({
            variantId: r.variantId,
            sku: r.sku,
            size: r.size,
            onHand: r.onHand,
            reserved: r.reserved,
            available: r.available,
          }))}
          lowStockThreshold={settings.low_stock_threshold}
        />
      </section>
    </>
  )
}
