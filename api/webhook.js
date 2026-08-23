/* ==========================================================================
   /api/webhook  — Viva's server-to-server notifications.

   GET  → Viva's URL verification handshake. Must answer {"Key": "..."} with
          the key fetched from Viva using the MERCHANT credentials.
   POST → an event. We only act on:
            1796  Transaction Payment Created  (money captured)
            1798  Transaction Failed

   Why this exists when /api/return already verifies: the customer can close
   the tab before being redirected back. The webhook is what makes sure a paid
   order is still recorded when that happens.

   Viva does not sign the POST body. Treat it as a HINT, not as truth: we take
   only the transactionId from it and then re-verify against the Viva API,
   exactly as /api/return does. That way a forged POST cannot mark an order paid.
   ========================================================================== */

import { retrieveTransaction, webhookVerificationKey, VivaError } from './_lib/viva.js'
import { getOrder, getOrderByVivaCode, putOrder } from './_lib/store.js'
import { notifyCustomer, notifyShop } from './_lib/notify.js'
import { fail, json, readJson } from './_lib/http.js'

const EVENT_PAYMENT_CREATED = 1796
const EVENT_TRANSACTION_FAILED = 1798

export default async function handler(req, res) {
  /* ---- verification handshake ------------------------------------------ */
  if (req.method === 'GET') {
    try {
      const Key = await webhookVerificationKey()
      return json(res, 200, { Key })
    } catch (err) {
      console.error('[webhook] key fetch failed', err instanceof VivaError ? err.body : err)
      return fail(res, 500, 'WEBHOOK_KEY_UNAVAILABLE')
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return fail(res, 405, 'METHOD_NOT_ALLOWED')
  }

  /* ---- event ------------------------------------------------------------ */
  let body
  try {
    body = await readJson(req)
  } catch {
    return json(res, 200, { ok: true, ignored: 'unreadable' }) // never make Viva retry forever
  }

  const eventTypeId = Number(body?.EventTypeId ?? 0)
  const data = body?.EventData ?? {}
  const transactionId = String(data.TransactionId ?? '').trim()

  // Always 200 quickly for events we don't handle — a non-2xx makes Viva retry.
  if (![EVENT_PAYMENT_CREATED, EVENT_TRANSACTION_FAILED].includes(eventTypeId)) {
    return json(res, 200, { ok: true, ignored: eventTypeId })
  }
  if (!transactionId) return json(res, 200, { ok: true, ignored: 'no-transaction-id' })

  const ref = String(data.MerchantTrns ?? '').trim()
  const orderCode = String(data.OrderCode ?? '').trim()

  let order = (ref ? await getOrder(ref) : null) ?? (await getOrderByVivaCode(orderCode))
  if (!order) {
    console.warn('[webhook] event for unknown order', { eventTypeId, ref, orderCode, transactionId })
    return json(res, 200, { ok: true, ignored: 'unknown-order' })
  }

  if (order.status === 'paid') return json(res, 200, { ok: true, already: 'paid' })

  if (eventTypeId === EVENT_TRANSACTION_FAILED) {
    await putOrder({ ...order, status: 'payment_failed', vivaTransactionId: transactionId })
    return json(res, 200, { ok: true, status: 'payment_failed' })
  }

  /* ---- re-verify against the API, never trust the payload -------------- */
  let txn
  try {
    txn = await retrieveTransaction(transactionId)
  } catch (err) {
    console.error('[webhook] verification failed', transactionId, err instanceof VivaError ? err.body : err)
    // 500 → Viva retries with backoff, which is what we want here
    return fail(res, 500, 'VERIFICATION_FAILED')
  }

  if (!txn.paid) {
    await putOrder({ ...order, status: 'payment_failed', vivaStatusId: txn.statusId })
    return json(res, 200, { ok: true, status: 'payment_failed' })
  }

  if (txn.amountCents !== order.totalCents) {
    console.error('[webhook] AMOUNT MISMATCH', {
      ref: order.ref,
      expected: order.totalCents,
      captured: txn.amountCents,
    })
    await putOrder({
      ...order,
      status: 'held_amount_mismatch',
      vivaTransactionId: transactionId,
      capturedCents: txn.amountCents,
    })
    return json(res, 200, { ok: true, status: 'held_amount_mismatch' })
  }

  const paid = {
    ...order,
    status: 'paid',
    vivaTransactionId: transactionId,
    vivaStatusId: txn.statusId,
    cardLast4: txn.cardNumber ? String(txn.cardNumber).slice(-4) : null,
    paidAt: txn.insDate ?? new Date().toISOString(),
    settledBy: 'webhook',
  }
  await putOrder(paid)
  await Promise.allSettled([notifyShop(paid), notifyCustomer(paid)])

  return json(res, 200, { ok: true, status: 'paid' })
}
