/* ==========================================================================
   GET /api/order?ref=FM-XXXXXX

   Powers the confirmation page. Returns only the fields in publicView() —
   the order reference is a low-entropy handle (32^6), so this must never
   expose anything an attacker could use, i.e. no full address, no card data,
   no raw provider payload.
   ========================================================================== */

import { getOrder, publicView } from './_lib/store.js'
import { fail, json, methodGuard, query, rateLimit } from './_lib/http.js'

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return

  const limit = rateLimit(req, { max: 60, windowMs: 60_000 })
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter ?? 60))
    return fail(res, 429, 'RATE_LIMITED')
  }

  const ref = String(query(req).ref ?? '').trim().toUpperCase()
  if (!/^FM-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(ref)) {
    return fail(res, 400, 'BAD_REF')
  }

  const order = await getOrder(ref)
  if (!order) return fail(res, 404, 'NOT_FOUND')

  return json(res, 200, { order: publicView(order) })
}
