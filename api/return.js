/* ==========================================================================
   GET /api/return   — the Success / Failure URL configured on the Viva
                       payment source.

   Viva appends ?t={transactionId}&s={orderCode}&lang=&eventId=&eci=

   ⚠️  The query string arrives via the customer's browser and is therefore
   untrusted. We never mark an order paid because of it. We call Viva's
   transaction API and compare the amount they actually captured against the
   amount we recorded. Anything that doesn't match is flagged, not fulfilled.

   Then we 302 to the SPA's order page, which is a HashRouter route.
   ========================================================================== */

import { retrieveTransaction, VivaError } from './_lib/viva.js'
import { getOrder, getOrderByVivaCode, putOrder } from './_lib/store.js'
import { notifyCustomer, notifyShop } from './_lib/notify.js'
import { query, redirect, siteOrigin, methodGuard } from './_lib/http.js'

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return

  const q = query(req)
  const transactionId = String(q.t ?? '').trim()
  const orderCode = String(q.s ?? '').trim()
  const origin = siteOrigin(req)

  const to = (path) => redirect(res, `${origin}/#${path}`)

  // Customer pressed cancel, or Viva sent them to the Failure URL
  if (!transactionId) {
    const cancelled = await getOrderByVivaCode(orderCode)
    if (cancelled && cancelled.status === 'pending_payment') {
      await putOrder({ ...cancelled, status: 'payment_cancelled' })
    }
    return to(cancelled ? `/order/${cancelled.ref}` : '/order/failed')
  }

  /* ---- ask Viva what really happened ----------------------------------- */
  let txn
  try {
    txn = await retrieveTransaction(transactionId)
  } catch (err) {
    console.error('[return] could not verify transaction', transactionId, err instanceof VivaError ? err.body : err)
    // Do NOT guess. The webhook is the second chance to settle this order.
    const pending = await getOrderByVivaCode(orderCode)
    return to(pending ? `/order/${pending.ref}?verify=pending` : '/order/failed')
  }

  /* ---- find our order: merchantTrns is our own ref --------------------- */
  const order =
    (txn.merchantTrns ? await getOrder(String(txn.merchantTrns).trim()) : null) ??
    (await getOrderByVivaCode(txn.orderCode || orderCode))

  if (!order) {
    console.error('[return] paid transaction with no matching local order', {
      transactionId,
      merchantTrns: txn.merchantTrns,
      orderCode: txn.orderCode,
    })
    return to('/order/failed')
  }

  if (order.status === 'paid') return to(`/order/${order.ref}`) // refresh / back button

  if (!txn.paid) {
    await putOrder({
      ...order,
      status: 'payment_failed',
      vivaTransactionId: transactionId,
      vivaStatusId: txn.statusId,
    })
    return to(`/order/${order.ref}`)
  }

  /* ---- the important check: did they pay what we asked? ---------------- */
  const amountOk = txn.amountCents === order.totalCents
  if (!amountOk) {
    console.error('[return] AMOUNT MISMATCH — order held for manual review', {
      ref: order.ref,
      expected: order.totalCents,
      captured: txn.amountCents,
      transactionId,
    })
    await putOrder({
      ...order,
      status: 'held_amount_mismatch',
      vivaTransactionId: transactionId,
      capturedCents: txn.amountCents,
    })
    return to(`/order/${order.ref}`)
  }

  const paid = {
    ...order,
    status: 'paid',
    vivaTransactionId: transactionId,
    vivaStatusId: txn.statusId,
    cardLast4: txn.cardNumber ? String(txn.cardNumber).slice(-4) : null,
    paidAt: txn.insDate ?? new Date().toISOString(),
  }
  await putOrder(paid)
  await Promise.allSettled([notifyShop(paid), notifyCustomer(paid)])

  return to(`/order/${order.ref}`)
}
