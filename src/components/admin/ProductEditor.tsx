'use client'

/* ============================================================================
 * Editing one product: price, sale price, and whether it is live.
 *
 * Prices are typed in euros and sent in cents. The conversion happens once,
 * here, at the boundary — everywhere inside the system money is an integer
 * number of cents, because 0.1 + 0.2 is not 0.3 and a shop cannot be told its
 * takings are off by a cent because of binary floating point.
 *
 * "Hidden" does not delete anything. It takes the product off the storefront
 * and leaves every order that already contains it intact.
 * ========================================================================== */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  productId: string
  priceCents: number
  salePriceCents: number | null
  isActive: boolean
}

/** Euros as typed → integer cents. Rejects anything that is not a clean
 *  amount, rather than silently rounding someone's price. */
function toCents(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
  return Math.round(Number(trimmed) * 100)
}

const toEuros = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2))

export function ProductEditor({ productId, priceCents, salePriceCents, isActive }: Props) {
  const router = useRouter()
  const [price, setPrice] = useState(toEuros(priceCents))
  const [sale, setSale] = useState(toEuros(salePriceCents))
  const [active, setActive] = useState(isActive)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const priceValue = toCents(price)
    if (priceValue === null) {
      setError('Price must be an amount like 59 or 59.90.')
      return
    }
    const saleValue = sale.trim() === '' ? null : toCents(sale)
    if (sale.trim() !== '' && saleValue === null) {
      setError('Sale price must be an amount like 44.90, or empty for no sale.')
      return
    }
    if (saleValue !== null && saleValue >= priceValue) {
      setError('A sale price has to be lower than the normal price.')
      return
    }

    setStatus('saving')
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceCents: priceValue,
          salePriceCents: saleValue,
          isActive: active,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; message?: string }
      if (!res.ok || !data.ok) {
        setError(data.message ?? 'Could not save that.')
        setStatus('idle')
        return
      }
      setStatus('saved')
      router.refresh()
    } catch {
      setError('Could not reach the server.')
      setStatus('idle')
    }
  }

  const discount =
    toCents(sale) !== null && toCents(price) !== null && toCents(sale)! < toCents(price)!
      ? Math.round((1 - toCents(sale)! / toCents(price)!) * 100)
      : null

  return (
    <form onSubmit={save} className="max-w-xl space-y-6 border border-line bg-paper p-6">
      {error && (
        <p role="alert" className="border border-sale/40 bg-sale/5 px-4 py-3 text-sm text-sale">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="label block text-muted">
            Price (€)
          </label>
          <input
            id="price"
            value={price}
            inputMode="decimal"
            onChange={(e) => {
              setPrice(e.target.value)
              setStatus('idle')
            }}
            className="mt-2 w-full border border-line px-3.5 py-3 text-right tabular-nums outline-none focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="sale" className="label block text-muted">
            Sale price (€)
          </label>
          <input
            id="sale"
            value={sale}
            inputMode="decimal"
            placeholder="none"
            onChange={(e) => {
              setSale(e.target.value)
              setStatus('idle')
            }}
            className="mt-2 w-full border border-line px-3.5 py-3 text-right tabular-nums outline-none focus:border-ink"
          />
          <p className="mt-1.5 text-xs text-muted">
            {discount !== null ? `${discount}% off. ` : 'Leave empty for no sale. '}
            An automatic promotion never stacks on top of this — the customer gets whichever is
            cheaper.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            setActive(e.target.checked)
            setStatus('idle')
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink)]"
        />
        <span>
          Show in the shop
          <span className="mt-0.5 block text-xs text-muted">
            Unticking hides it from the storefront and search. Nothing is deleted, and past
            orders keep it.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-4 border-t border-line pt-5">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="border border-ink bg-ink px-6 py-3 label text-paper hover:opacity-90 disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && <span className="text-sm text-ok">Saved.</span>}
      </div>
    </form>
  )
}
