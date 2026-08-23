/* ==========================================================================
   ORDER EMAILS — optional.

   Set RESEND_API_KEY and SHOP_ORDER_EMAIL to turn this on. Without them the
   functions no-op and just log, so the payment flow works out of the box with
   nothing to sign up for. Card-payment customers already get a receipt from
   Viva itself (paymentNotification: true), so the shop notification is the
   one that really matters — otherwise nobody knows to pack the box.
   ========================================================================== */

import { formatCents } from '../../src/lib/pricing.js'
import { SHOP } from '../../src/lib/shop.js'

const KEY = process.env.RESEND_API_KEY
const TO = process.env.SHOP_ORDER_EMAIL || SHOP.email
const FROM = process.env.ORDER_FROM_EMAIL || 'orders@fitnessmaniacs.com.cy'

export const emailEnabled = Boolean(KEY)

const FULFILMENT_LABEL = {
  delivery: 'Courier delivery — PAID online',
  pickup_paid: 'Collect in Meneou — PAID online',
  pickup_unpaid: 'Collect in Meneou — COLLECT PAYMENT AT COUNTER',
  cod: 'Courier delivery — CASH ON DELIVERY, collect from customer',
}

function orderText(order) {
  const lines = order.lines
    .map(
      (l) =>
        `  ${l.qty} x ${l.name}` +
        `${[l.size, l.flavour].filter(Boolean).length ? ` (${[l.size, l.flavour].filter(Boolean).join(', ')})` : ''}` +
        ` — ${formatCents(l.lineCents)}`,
    )
    .join('\n')

  const c = order.customer

  return [
    `ORDER ${order.ref}`,
    `${FULFILMENT_LABEL[order.fulfilment] ?? order.fulfilment}`,
    '',
    lines,
    '',
    `Items:      ${formatCents(order.itemsCents)}`,
    order.deliveryCents ? `Delivery:   ${formatCents(order.deliveryCents)}` : 'Delivery:   Free',
    order.surchargeCents ? `COD fee:    ${formatCents(order.surchargeCents)}` : null,
    `TOTAL:      ${formatCents(order.totalCents)}`,
    `(incl. VAT ${formatCents(order.vatCents)} at ${Math.round(order.vatRate * 100)}%)`,
    '',
    'CUSTOMER',
    `  ${c.fullName}`,
    `  ${c.email}`,
    `  ${c.phone}`,
    c.address ? `  ${c.address}, ${c.city} ${c.postcode ?? ''}`.trimEnd() : null,
    c.notes ? `  Notes: ${c.notes}` : null,
    '',
    order.vivaOrderCode ? `Viva order code: ${order.vivaOrderCode}` : null,
    order.vivaTransactionId ? `Viva transaction: ${order.vivaTransactionId}` : null,
    `Placed: ${order.createdAt}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

async function send({ to, subject, text, replyTo }) {
  if (!KEY) {
    console.log(`[notify] email disabled — would have sent "${subject}" to ${to}`)
    return { sent: false, reason: 'DISABLED' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, text, reply_to: replyTo }),
    })
    if (!res.ok) {
      console.error('[notify] send failed', res.status, (await res.text()).slice(0, 200))
      return { sent: false, reason: 'PROVIDER_ERROR' }
    }
    return { sent: true }
  } catch (err) {
    console.error('[notify] send threw', err.message)
    return { sent: false, reason: 'EXCEPTION' }
  }
}

/** Tell the shop to pack the order. Never allowed to break the payment flow —
 *  a failed email must not fail a paid order. */
export async function notifyShop(order) {
  const flag = order.fulfilment === 'cod' || order.fulfilment === 'pickup_unpaid' ? ' [UNPAID]' : ''
  return send({
    to: TO,
    subject: `New order ${order.ref} — ${formatCents(order.totalCents)}${flag}`,
    text: orderText(order),
    replyTo: order.customer.email,
  })
}

/** Confirmation to the customer. For card orders this is a nice-to-have on top
 *  of Viva's own receipt; for COD and reserve-in-shop it is the only one. */
export async function notifyCustomer(order) {
  const collect =
    order.fulfilment === 'pickup_unpaid'
      ? `\nPay when you collect: ${formatCents(order.totalCents)}\n${SHOP.address}\nMon–Fri ${SHOP.hours.week}, Sat ${SHOP.hours.sat}`
      : order.fulfilment === 'cod'
        ? `\nHave ${formatCents(order.totalCents)} in cash ready for the courier.`
        : ''

  return send({
    to: order.customer.email,
    subject: `${SHOP.name} — order ${order.ref} confirmed`,
    text:
      `Thanks ${order.customer.fullName.split(' ')[0]},\n\n` +
      `We have your order ${order.ref}.\n${collect}\n\n` +
      orderText(order) +
      `\n\nQuestions? ${SHOP.phone} · ${SHOP.email}`,
    replyTo: TO,
  })
}
