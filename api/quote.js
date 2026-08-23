/* ==========================================================================
   POST /api/quote   { lines, fulfilment }

   Prices a basket without creating anything. Two uses:
     • the front end can confirm totals against the server before submitting
     • pricing is testable without a payment provider or any credentials

   Same quote() call the real checkout uses, so if this says €39.50 that is
   exactly what /api/checkout will ask Viva to capture.
   ========================================================================== */

import { quote } from '../src/lib/pricing.js'
import { fail, json, methodGuard, rateLimit, readJson } from './_lib/http.js'

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return

  const limit = rateLimit(req, { max: 60, windowMs: 60_000 })
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

  const priced = quote(body.lines, body.fulfilment)
  if (!priced.ok) return fail(res, 400, priced.error, priced.detail)

  return json(res, 200, { quote: priced.quote })
}
