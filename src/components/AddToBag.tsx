'use client'

/* ============================================================================
 * Size selection and add-to-bag — spec sections 7, 12 and 39.
 *
 * The important behaviour: the server owns availability. This component shows
 * what it was told at render time, but when the customer clicks Add, the POST
 * may still come back "no longer available" — because someone else took the
 * last one in between. That is the expected path, not an error case, and it is
 * handled by showing the real reason and marking the size sold out in place.
 *
 * Section 39 explicitly forbids solving this with a page reload. We update the
 * component's own state from the server's answer instead.
 * ========================================================================== */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { announceBagCount } from '@/lib/bag-events'

export type VariantOption = {
  id: string
  sku: string
  size: string
  colorName: Record<string, string> | null
  colorHex: string | null
  finalCents: number
  listCents: number
  available: number
  inStock: boolean
  isLowStock: boolean
}

export function AddToBag({
  locale,
  variants,
  reservationMinutes,
  soldOut = false,
}: {
  locale: Locale
  variants: VariantOption[]
  reservationMinutes: number
  /** The owner has marked the whole product sold out. The server refuses it
   *  anyway; this just says so before anyone tries. */
  soldOut?: boolean
}) {
  const t = getTranslator(locale)
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  /* Colours, in the order the admin arranged them. */
  const colours = variants.reduce<{ hex: string | null; name: Record<string, string> | null }[]>(
    (acc, v) => {
      if (!acc.some((c) => c.hex === v.colorHex)) acc.push({ hex: v.colorHex, name: v.colorName })
      return acc
    },
    [],
  )

  const [colour, setColour] = useState<string | null>(colours[0]?.hex ?? null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  /* Local overlay of what the server has told us since the page rendered, so a
     size that just sold out greys out without a reload. */
  const [liveAvailability, setLiveAvailability] = useState<Record<string, number>>({})

  const forColour = variants.filter((v) => v.colorHex === colour)
  const selected = forColour.find((v) => v.id === variantId) ?? null

  const availabilityOf = (v: VariantOption) =>
    liveAvailability[v.id] !== undefined ? liveAvailability[v.id] : v.available

  async function add() {
    if (!selected) {
      setMessage({ tone: 'error', text: t('pdp.sizeRequired') })
      return
    }
    setBusy(true)
    setMessage(null)

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: selected.id, quantity }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        message?: string
        available?: number
        cartCount?: number
      }

      if (!res.ok || !data.ok) {
        /* Reflect the server's truth in the UI immediately. */
        if (typeof data.available === 'number') {
          setLiveAvailability((prev) => ({ ...prev, [selected.id]: data.available! }))
          if (data.available === 0) setVariantId(null)
        }
        setMessage({ tone: 'error', text: data.message ?? t('err.generic') })
        return
      }

      setMessage({ tone: 'ok', text: t('pdp.added') })
      /* The header badge moves now; the refresh brings the rest along. */
      announceBagCount(data.cartCount)
      startTransition(() => router.refresh())
    } catch {
      setMessage({ tone: 'error', text: t('err.network') })
    } finally {
      setBusy(false)
    }
  }

  const anyInStock = !soldOut && forColour.some((v) => availabilityOf(v) > 0)

  return (
    <div>
      {/* ------------------------------------------------------- colours -- */}
      {colours.length > 1 && (
        <fieldset className="mb-6">
          <legend className="label mb-2.5">
            {t('pdp.colour')}
            {(() => {
              const name = colours.find((c) => c.hex === colour)?.name
              return name ? (
                <span className="ml-2 font-normal normal-case tracking-normal text-muted">
                  {name[locale] ?? name.en}
                </span>
              ) : null
            })()}
          </legend>
          <div className="flex gap-2">
            {colours.map((c) => (
              <button
                key={c.hex ?? 'none'}
                type="button"
                onClick={() => {
                  setColour(c.hex)
                  setVariantId(null)
                }}
                aria-pressed={colour === c.hex}
                aria-label={c.name?.[locale] ?? c.name?.en ?? 'Colour'}
                title={c.name?.[locale] ?? c.name?.en ?? undefined}
                className={`h-9 w-9 rounded-full border-2 transition-all ${
                  colour === c.hex ? 'border-ink' : 'border-line hover:border-line-strong'
                }`}
                style={{ backgroundColor: c.hex ?? '#ddd' }}
              />
            ))}
          </div>
        </fieldset>
      )}

      {/* --------------------------------------------------------- sizes -- */}
      <fieldset>
        <div className="mb-2.5 flex items-baseline justify-between">
          <legend className="label">{t('pdp.selectSize')}</legend>
        </div>

        <div className="flex flex-wrap gap-2">
          {forColour.map((v) => {
            const available = availabilityOf(v)
            const sizeGone = soldOut || available <= 0
            const active = variantId === v.id
            return (
              <button
                key={v.id}
                type="button"
                disabled={sizeGone}
                onClick={() => {
                  setVariantId(v.id)
                  setQuantity(1)
                  setMessage(null)
                }}
                aria-pressed={active}
                title={sizeGone ? t('pdp.outOfStockSize', { size: v.size }) : undefined}
                className={`relative min-w-14 border px-3 py-3 text-sm transition-colors ${
                  sizeGone
                    ? 'cursor-not-allowed border-line text-line-strong'
                    : active
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line hover:border-ink'
                }`}
              >
                {v.size}
                {sizeGone && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center"
                  >
                    <span className="h-px w-full -rotate-12 bg-line-strong" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* stock nudge for the chosen size */}
        {selected && (
          <p className="mt-3 text-xs">
            {availabilityOf(selected) <= 0 ? (
              <span className="text-sale">{t('pdp.soldOut')}</span>
            ) : selected.isLowStock || availabilityOf(selected) <= 3 ? (
              <span className="text-sale">
                {t('pdp.lowStock', { n: availabilityOf(selected) })}
              </span>
            ) : (
              <span className="text-ok">{t('pdp.inStock')}</span>
            )}
            <span className="ml-3 text-muted">
              {t('pdp.sku')} {selected.sku}
            </span>
          </p>
        )}
      </fieldset>

      {/* ------------------------------------------------------ quantity -- */}
      {selected && availabilityOf(selected) > 1 && (
        <div className="mt-6 flex items-center gap-3">
          <span className="label">{t('pdp.quantity')}</span>
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-11 w-11 text-lg hover:bg-paper-2"
              aria-label="−"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => Math.min(Math.min(20, availabilityOf(selected)), q + 1))
              }
              className="h-11 w-11 text-lg hover:bg-paper-2"
              aria-label="+"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- add -- */}
      <button
        type="button"
        onClick={add}
        disabled={busy || pending || !anyInStock}
        className="mt-7 w-full bg-ink px-6 py-4 label text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {!anyInStock
          ? t('pdp.soldOut')
          : busy
            ? t('pdp.adding')
            : t('pdp.addToBag')}
      </button>

      {!anyInStock && (
        <div className="mt-4 border border-line bg-paper-2 px-4 py-3.5">
          <p className="label">{t('pdp.soldOutTitle')}</p>
          <p className="mt-1.5 text-sm text-ink-soft">{t('pdp.soldOutBody')}</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('support:open'))}
            className="mt-2.5 text-sm underline underline-offset-4 hover:text-ink-soft"
          >
            {t('pdp.askRestock')}
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 text-sm ${message.tone === 'ok' ? 'text-ok' : 'text-sale'}`}
        >
          {message.text}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        {t('pdp.reserved', { minutes: reservationMinutes })}
      </p>
    </div>
  )
}
