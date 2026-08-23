/* ==========================================================================
   POST /api/checkout

   Body: { lines: [{id, size, flavour, qty}], fulfilment, customer, lang }

   The client sends WHAT was ordered, never WHAT IT COSTS. Every figure below
   is recomputed from src/lib/pricing.js, so editing prices in devtools
   changes nothing about what gets charged.

   Card orders   → create a Viva payment order, return its redirect URL.
   COD / pickup  → record the order, notify the shop, return the local
                   confirmation URL. No payment provider involved.
   ========================================================================== */

import { FULFILMENT, orderRef, quote } from '../src/lib/pricing.js'
import { createPaymentOrder, isConfigured, VivaError, vivaEnv } from './_lib/viva.js'
import { getOrder, putOrder } from './_lib/store.js'
import { notifyCustomer, notifyShop } from './_lib/notify.js'
import { fail, json, methodGuard, rateLimit, readJson, siteOrigin, validateCustomer } from './_lib/http.js'

async function uniqueRef(attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const ref = orderRef()
    if (!(await getOrder(ref))) return ref
  }
  // 32^6 keyspace — six collisions in a row means something is very wrong
  throw new Error('Could not allocate a unique order reference')
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return

  const limit = rateLimit(req, { max: 12, windowMs: 60_000 })
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter ?? 60))
    return fail(res, 429, 'RATE_LIMITED')
  }

  let body
  try {
    body = await readJson(req)
  } catch {
    return fail(res, 413, 'PAYLOAD_TOO_LARGE')
  }
  if (!body) return fail(res, 400, 'INVALID_JSON')

  /* ---- 1. price it ourselves ------------------------------------------- */
  const priced = quote(body.lines, body.fulfilment)
  if (!priced.ok) return fail(res, 400, priced.error, priced.detail)
  const q = priced.quote
  const method = FULFILMENT[q.fulfilment]

  /* ---- 2. validate the customer ---------------------------------------- */
  const { customer, errors, valid } = validateCustomer(body.customer, {
    needsAddress: method.needsAddress,
  })
  if (!valid) return fail(res, 422, 'INVALID_CUSTOMER', errors)

  /* ---- 3. refuse a card order we already know cannot be paid ----------- */
  if (method.paysOnline && !isConfigured()) {
    console.error(
      '[checkout] card order refused: Viva credentials are not set.\n' +
        '           Set VIVA_CLIENT_ID and VIVA_CLIENT_SECRET in .env.local, or in the\n' +
        '           Vercel project settings. See PAYMENTS.md → "Getting the credentials".\n' +
        '           Cash-on-delivery and reserve-in-shop need no credentials and still work.',
    )
    return fail(res, 503, 'PAYMENTS_NOT_CONFIGURED')
  }

  const lang = body.lang === 'el' ? 'el' : 'en'

  /* ---- 4. persist the order in `pending` ------------------------------- */
  let ref
  try {
    ref = await uniqueRef()
  } catch (err) {
    return fail(res, 500, 'REF_ALLOCATION_FAILED', err.message)
  }

  const order = {
    ref,
    status: method.paysOnline ? 'pending_payment' : 'awaiting_fulfilment',
    fulfilment: q.fulfilment,
    lines: q.lines,
    itemsCents: q.itemsCents,
    deliveryCents: q.deliveryCents,
    surchargeCents: q.surchargeCents,
    vatCents: q.vatCents,
    vatRate: q.vatRate,
    totalCents: q.totalCents,
    currency: q.currency,
    customer,
    lang,
    vivaEnv: vivaEnv(),
    createdAt: new Date().toISOString(),
  }

  await putOrder(order)

  /* ---- 5a. no online payment: done ------------------------------------- */
  if (!method.paysOnline) {
    // email must never be able to fail the order
    await Promise.allSettled([notifyShop(order), notifyCustomer(order)])
    return json(res, 200, {
      ref,
      mode: 'offline',
      totalCents: q.totalCents,
      redirectUrl: `${siteOrigin(req)}/#/order/${ref}`,
    })
  }

  /* ---- 5b. online payment: hand off to Viva ---------------------------- */
  const itemSummary = q.lines
    .map((l) => `${l.qty}x ${l.name}`)
    .join(', ')
    .slice(0, 120)

  try {
    const { orderCode, redirectUrl } = await createPaymentOrder({
      amountCents: q.totalCents,
      ref,
      customerTrns: `${itemSummary} · ${q.fulfilment === 'pickup_paid' ? 'Pickup Meneou' : 'Delivery'}`,
      customer: { ...customer, requestLang: lang },
    })

    await putOrder({ ...order, vivaOrderCode: orderCode })

    return json(res, 200, { ref, mode: 'viva', orderCode, redirectUrl })
  } catch (err) {
    await putOrder({
      ...order,
      status: 'payment_setup_failed',
      error: err instanceof VivaError ? `${err.message}` : 'UNKNOWN',
    })
    if (err instanceof VivaError) {
      console.error(`[checkout] ${err.code} (HTTP ${err.status}) — ${err.message}`)
      if (err.body) console.error('[checkout] provider said:', err.body)
      if (err.code === 'NOT_CONFIGURED') return fail(res, 503, 'PAYMENTS_NOT_CONFIGURED', { ref })
      return fail(res, 502, 'PAYMENT_PROVIDER_ERROR', { ref })
    }
    console.error('[checkout] unexpected', err)
    return fail(res, 500, 'CHECKOUT_FAILED', { ref })
  }
}
