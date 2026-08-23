/* ==========================================================================
   GET /api/config
   Lets the front end know how the backend is configured, so the UI can show a
   "sandbox — no real charge" banner and hide fulfilment options that are not
   switched on. Exposes flags only, never a credential.
   ========================================================================== */

import { FULFILMENT, FREE_DELIVERY_AT, DELIVERY_FEE, COD_SURCHARGE, VAT_RATE } from '../src/lib/pricing.js'
import { usingRedis } from './_lib/store.js'
import { emailEnabled } from './_lib/notify.js'
import { isConfigured, isWebhookConfigured, vivaEnv } from './_lib/viva.js'
import { json, methodGuard } from './_lib/http.js'

/** Turn options off per deployment, e.g. ENABLED_FULFILMENT="delivery,pickup_paid" */
function enabledFulfilment() {
  const raw = process.env.ENABLED_FULFILMENT
  const all = Object.keys(FULFILMENT)
  if (!raw) return all
  const wanted = raw.split(',').map((s) => s.trim())
  const filtered = all.filter((id) => wanted.includes(id))
  return filtered.length ? filtered : all
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return

  return json(res, 200, {
    vivaEnv: vivaEnv(),
    paymentsConfigured: isConfigured(),
    webhookConfigured: isWebhookConfigured(),
    fulfilment: enabledFulfilment(),
    durableOrders: usingRedis,
    emailEnabled,
    freeDeliveryAt: FREE_DELIVERY_AT,
    deliveryFee: DELIVERY_FEE,
    codSurcharge: COD_SURCHARGE,
    vatRate: VAT_RATE,
  })
}
