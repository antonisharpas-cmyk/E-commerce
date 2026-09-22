'use client'

/* ============================================================================
 * The stock editor.
 *
 * One row per size. Type a number, press Enter or Tab, it saves. No "Save all"
 * button, because a shop counting stock works one line at a time and losing a
 * screenful of edits to a mis-click is unforgivable.
 *
 * The number you type is the PHYSICAL count on the shelf — not what is
 * available to sell. Available is on-hand minus what live carts are holding,
 * and the server recomputes it, so the two can never disagree with what the
 * storefront shows.
 *
 * Refusals are shown in full: "5 units are currently held in customer carts"
 * is the whole explanation, and it comes from the server.
 * ========================================================================== */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pill } from './ui'

export type StockLine = {
  variantId: string
  sku: string
  size: string
  onHand: number
  reserved: number
  available: number
}

type RowState = {
  value: string
  status: 'idle' | 'saving' | 'saved' | 'error'
  message?: string
  onHand: number
  reserved: number
  available: number
}

export function StockEditor({
  lines,
  lowStockThreshold,
}: {
  lines: StockLine[]
  lowStockThreshold: number
}) {
  const router = useRouter()
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      lines.map((l) => [
        l.variantId,
        {
          value: String(l.onHand),
          status: 'idle' as const,
          onHand: l.onHand,
          reserved: l.reserved,
          available: l.available,
        },
      ]),
    ),
  )

  const patch = (id: string, next: Partial<RowState>) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], ...next } }))

  async function save(line: StockLine) {
    const row = rows[line.variantId]
    const parsed = Number(row.value)

    if (!Number.isInteger(parsed) || parsed < 0) {
      patch(line.variantId, { status: 'error', message: 'Whole numbers only, zero or more.' })
      return
    }
    /* Nothing changed — do not bother the server or flash a "saved". */
    if (parsed === row.onHand) {
      patch(line.variantId, { status: 'idle', message: undefined })
      return
    }

    patch(line.variantId, { status: 'saving', message: undefined })

    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: line.variantId, onHand: parsed }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        message?: string
        onHand?: number
        reserved?: number
        available?: number
      }

      if (!res.ok || !data.ok) {
        patch(line.variantId, {
          status: 'error',
          message: data.message ?? 'Could not save that.',
          /* Put the field back to the number that is actually stored, so the
             screen never shows a figure the database does not have. */
          value: String(row.onHand),
        })
        return
      }

      patch(line.variantId, {
        status: 'saved',
        onHand: data.onHand ?? parsed,
        reserved: data.reserved ?? row.reserved,
        available: data.available ?? parsed - row.reserved,
        value: String(data.onHand ?? parsed),
        message: undefined,
      })
      /* Refresh the server-rendered totals above the table. */
      router.refresh()
    } catch {
      patch(line.variantId, {
        status: 'error',
        message: 'Could not reach the server.',
        value: String(row.onHand),
      })
    }
  }

  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full min-w-[52rem] text-sm">
        <thead>
          <tr className="border-b border-line">
            {['Size', 'SKU', 'On the shelf', 'Held in carts', 'Available', ''].map((h) => (
              <th key={h} className="label px-4 py-3 text-left text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-line)]">
          {lines.map((line) => {
            const row = rows[line.variantId]
            return (
              <tr key={line.variantId} className={row.status === 'error' ? 'bg-sale/5' : undefined}>
                <td className="px-4 py-3 font-medium">{line.size}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{line.sku}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`Units on the shelf, size ${line.size}`}
                    value={row.value}
                    disabled={row.status === 'saving'}
                    onChange={(e) => patch(line.variantId, { value: e.target.value, status: 'idle' })}
                    onBlur={() => void save(line)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void save(line)
                      }
                      if (e.key === 'Escape') {
                        patch(line.variantId, { value: String(row.onHand), status: 'idle', message: undefined })
                      }
                    }}
                    className={`w-24 border px-3 py-2 text-right tabular-nums outline-none focus:border-ink ${
                      row.status === 'error' ? 'border-sale' : 'border-line'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{row.reserved}</td>
                <td className="px-4 py-3">
                  {row.available <= 0 ? (
                    <Pill tone="bad">Sold out</Pill>
                  ) : row.available <= lowStockThreshold ? (
                    <Pill tone="warn">{row.available}</Pill>
                  ) : (
                    <span className="tabular-nums">{row.available}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status === 'saving' && <span className="text-xs text-muted">Saving…</span>}
                  {row.status === 'saved' && <span className="text-xs text-ok">Saved</span>}
                  {row.status === 'error' && (
                    <span role="alert" className="text-xs text-sale">
                      {row.message}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
