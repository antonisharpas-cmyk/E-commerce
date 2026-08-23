/* Small helpers shared by every API handler. Written against the plain
   (req, res) Node signature so the same files run on Vercel and on the local
   Express dev server without a shim. */

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function fail(res, status, error, detail) {
  if (status >= 500) console.error('[api]', error, detail ?? '')
  return json(res, status, { error, ...(detail !== undefined ? { detail } : {}) })
}

export function redirect(res, location) {
  res.statusCode = 302
  res.setHeader('Location', location)
  res.setHeader('Cache-Control', 'no-store')
  res.end()
}

export function methodGuard(req, res, ...allowed) {
  if (allowed.includes(req.method)) return true
  res.setHeader('Allow', allowed.join(', '))
  fail(res, 405, 'METHOD_NOT_ALLOWED')
  return false
}

/** Vercel parses JSON bodies for us; the dev server uses express.json().
 *  This covers the case where neither did (raw stream). */
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body) {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 100_000) throw new Error('PAYLOAD_TOO_LARGE')
    chunks.push(chunk)
  }
  if (!chunks.length) return null
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

export function query(req) {
  if (req.query && typeof req.query === 'object') return req.query
  const u = new URL(req.url, 'http://localhost')
  return Object.fromEntries(u.searchParams)
}

/** Absolute origin of this deployment, used to build return URLs. */
export function siteOrigin(req) {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173'
  const proto = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/* ---- field validation ---------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/* Trim, strip control characters (they break log lines and Viva's own fields),
   and hard-cap length before anything reaches the payment provider. */
export const clean = (v, max = 200) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : ''

export function validateCustomer(input, { needsAddress }) {
  const errors = {}
  const c = {
    fullName: clean(input?.fullName, 80),
    email: clean(input?.email, 120).toLowerCase(),
    phone: clean(input?.phone, 30),
    address: clean(input?.address, 160),
    city: clean(input?.city, 60),
    postcode: clean(input?.postcode, 12),
    notes: clean(input?.notes, 400),
    countryCode: 'CY',
  }

  if (c.fullName.length < 2) errors.fullName = 'REQUIRED'
  if (!EMAIL.test(c.email)) errors.email = 'INVALID'
  if (c.phone.replace(/\D/g, '').length < 8) errors.phone = 'INVALID'
  if (needsAddress) {
    if (c.address.length < 4) errors.address = 'REQUIRED'
    if (c.city.length < 2) errors.city = 'REQUIRED'
  }

  return { customer: c, errors, valid: Object.keys(errors).length === 0 }
}

/* ---- crude in-memory rate limit ----------------------------------------- */
/* Not a substitute for a real WAF, but it stops a trivial loop from creating
   thousands of Viva orders from one warm instance. */
const hits = new Map()

export function rateLimit(req, { max = 12, windowMs = 60_000 } = {}) {
  /* RATE_LIMIT_MAX lets the dev server and the test suite raise the ceiling
     without changing handler code. Unset in production → the caller's default. */
  const envMax = Number(process.env.RATE_LIMIT_MAX)
  if (Number.isFinite(envMax) && envMax > 0) max = envMax

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + windowMs })
    if (hits.size > 5000) hits.clear()
    return { allowed: true }
  }
  entry.count += 1
  return { allowed: entry.count <= max, retryAfter: Math.ceil((entry.reset - now) / 1000) }
}
