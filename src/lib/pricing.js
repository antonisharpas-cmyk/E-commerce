/* ==========================================================================
   PRICING — the single source of truth, imported by BOTH the browser and the
   API functions. The server recomputes every total from this file, so a
   tampered client payload can never change what the customer is charged.

   All money is handled in CENTS (integers) to avoid float drift, and only
   formatted as euros at the edges.
   ========================================================================== */

import { PRODUCTS } from './catalog.js'

/* ---- configuration ------------------------------------------------------ */

export const CURRENCY = 'EUR'
export const CURRENCY_NUMERIC = 978 // ISO 4217 numeric, required by Viva

/** Cyprus standard VAT.
 *  ⚠️  CONFIRM WITH HIS ACCOUNTANT BEFORE GOING LIVE.
 *  Cyprus runs 19% standard / 9% / 5% reduced. Whether food supplements fall
 *  under standard or the 5% foodstuffs rate depends on how each product is
 *  classified, and it is not a call a developer should make. 19% is the safe
 *  default (over-declaring is recoverable; under-declaring is a penalty).
 *  Displayed prices are VAT-INCLUSIVE, as EU consumer law requires. */
export const VAT_RATE = 0.19

export const FREE_DELIVERY_AT = 5000 // €50.00
export const DELIVERY_FEE = 450 // €4.50
export const COD_SURCHARGE = 200 // €2.00 courier cash-handling fee
export const MAX_QTY_PER_LINE = 20

/* ---- fulfilment methods -------------------------------------------------- */

export const FULFILMENT = {
  /* pay by card now, courier delivers */
  delivery: { id: 'delivery', paysOnline: true, needsAddress: true, surcharge: 0 },
  /* pay by card now, collect from the Meneou shop */
  pickup_paid: { id: 'pickup_paid', paysOnline: true, needsAddress: false, surcharge: 0 },
  /* reserve online, pay cash/card at the counter */
  pickup_unpaid: { id: 'pickup_unpaid', paysOnline: false, needsAddress: false, surcharge: 0 },
  /* courier collects cash on the doorstep */
  cod: { id: 'cod', paysOnline: false, needsAddress: true, surcharge: COD_SURCHARGE },
}

export const isFulfilment = (id) => Object.hasOwn(FULFILMENT, id)

/* ---- money helpers ------------------------------------------------------- */

export const toCents = (euros) => Math.round(Number(euros) * 100)
export const fromCents = (cents) => cents / 100
export const formatCents = (cents, locale = 'en-GB') =>
  '€' + (cents / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ---- the quote ----------------------------------------------------------- */

/**
 * Turn an untrusted list of cart lines into a priced, validated quote.
 * Callers MUST use the returned figures, never anything the client sent.
 *
 * @param {Array<{id:string,size?:string,flavour?:string,qty:number}>} rawLines
 * @param {string} fulfilmentId
 * @returns {{ok:true, quote:object} | {ok:false, error:string, detail?:any}}
 */
export function quote(rawLines, fulfilmentId = 'delivery') {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return { ok: false, error: 'EMPTY_CART' }
  }
  if (rawLines.length > 50) {
    return { ok: false, error: 'TOO_MANY_LINES' }
  }
  if (!isFulfilment(fulfilmentId)) {
    return { ok: false, error: 'BAD_FULFILMENT', detail: fulfilmentId }
  }

  const method = FULFILMENT[fulfilmentId]
  const lines = []

  for (const raw of rawLines) {
    const product = PRODUCTS.find((p) => p.id === raw?.id)
    if (!product) return { ok: false, error: 'UNKNOWN_PRODUCT', detail: raw?.id }

    const qty = Number.parseInt(raw.qty, 10)
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return { ok: false, error: 'BAD_QUANTITY', detail: { id: raw.id, qty: raw.qty } }
    }
    if (qty > product.stock) {
      return { ok: false, error: 'INSUFFICIENT_STOCK', detail: { id: raw.id, available: product.stock } }
    }

    // options must be ones we actually offer — no free-text into the order record
    const size = product.sizes.includes(raw.size) ? raw.size : (product.sizes[0] ?? null)
    const flavour = product.flavours.includes(raw.flavour) ? raw.flavour : (product.flavours[0] ?? null)

    const unit = toCents(product.price)
    lines.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      size,
      flavour,
      qty,
      unitCents: unit,
      lineCents: unit * qty,
    })
  }

  const itemsCents = lines.reduce((s, l) => s + l.lineCents, 0)

  const deliveryCents =
    method.needsAddress && itemsCents < FREE_DELIVERY_AT ? DELIVERY_FEE : 0
  const surchargeCents = method.surcharge

  const totalCents = itemsCents + deliveryCents + surchargeCents

  // prices are VAT-inclusive, so VAT is extracted from the gross, not added
  const vatCents = Math.round(totalCents - totalCents / (1 + VAT_RATE))

  return {
    ok: true,
    quote: {
      lines,
      itemsCents,
      deliveryCents,
      surchargeCents,
      totalCents,
      vatCents,
      netCents: totalCents - vatCents,
      vatRate: VAT_RATE,
      currency: CURRENCY,
      fulfilment: method.id,
      paysOnline: method.paysOnline,
      freeDeliveryAt: FREE_DELIVERY_AT,
      itemCount: lines.reduce((s, l) => s + l.qty, 0),
    },
  }
}

/** Short human reference shown to the customer and written to Viva's
 *  merchantTrns, e.g. "FM-7X4K2Q". Deterministic length, no ambiguous chars. */
export function orderRef(rand = Math.random) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(rand() * alphabet.length)]
  return `FM-${out}`
}
