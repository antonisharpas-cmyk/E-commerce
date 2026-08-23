/* ==========================================================================
   VIVA.COM (Viva Wallet) — Smart Checkout integration
   Docs: https://developer.viva.com/smart-checkout/smart-checkout-integration/

   Flow:
     1. POST {accounts}/connect/token          → Bearer access token (1h)
     2. POST {api}/checkout/v2/orders           → orderCode (16 digits)
     3. redirect customer to {checkout}/web/checkout?ref={orderCode}
     4. Viva redirects back to our Success URL with ?t={transactionId}
     5. GET {api}/checkout/v2/transactions/{t}   → verify amount + statusId

   NOTHING in this file contains a credential. Everything comes from env vars.
   ========================================================================== */

const DEMO = {
  accounts: 'https://demo-accounts.vivapayments.com',
  api: 'https://demo-api.vivapayments.com',
  checkout: 'https://demo.vivapayments.com',
}

const LIVE = {
  accounts: 'https://accounts.vivapayments.com',
  api: 'https://api.vivapayments.com',
  checkout: 'https://www.vivapayments.com',
}

/** 'demo' unless VIVA_ENV is exactly 'production' — fail safe, never charge by
 *  accident because someone forgot to set a variable. */
export const vivaEnv = () => (process.env.VIVA_ENV === 'production' ? 'production' : 'demo')
export const hosts = () => (vivaEnv() === 'production' ? LIVE : DEMO)

export class VivaError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'VivaError'
    this.status = status
    this.body = body
  }
}

function credentials() {
  const clientId = process.env.VIVA_CLIENT_ID
  const clientSecret = process.env.VIVA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new VivaError(
      'VIVA_CLIENT_ID / VIVA_CLIENT_SECRET are not set. Copy .env.example to .env.local and fill them in.',
      500,
    )
  }
  return { clientId, clientSecret }
}

/* ---- token, cached in module scope --------------------------------------- */
/* A warm serverless instance reuses the token; a cold one fetches a new one.
   We expire 60s early so an in-flight request can't be caught by the boundary. */
let cached = { token: null, expiresAt: 0 }

export async function accessToken({ force = false } = {}) {
  const now = Date.now()
  if (!force && cached.token && now < cached.expiresAt) return cached.token

  const { clientId, clientSecret } = credentials()
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${hosts().accounts}/connect/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })

  const body = await res.text()
  if (!res.ok) {
    throw new VivaError(`Viva token request failed (${res.status})`, res.status, body.slice(0, 500))
  }

  let json
  try {
    json = JSON.parse(body)
  } catch {
    throw new VivaError('Viva token response was not JSON', 502, body.slice(0, 300))
  }

  if (!json.access_token) {
    throw new VivaError('Viva token response had no access_token', 502, json)
  }

  cached = {
    token: json.access_token,
    expiresAt: now + Math.max(0, (Number(json.expires_in) || 3600) - 60) * 1000,
  }
  return cached.token
}

/* ---- authenticated request helper, retries once on 401 ------------------- */

async function apiFetch(path, init = {}, { retryOn401 = true } = {}) {
  const token = await accessToken()
  const res = await fetch(`${hosts().api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (res.status === 401 && retryOn401) {
    await accessToken({ force: true })
    return apiFetch(path, init, { retryOn401: false })
  }

  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* leave json null, surface the raw text below */
  }

  if (!res.ok) {
    throw new VivaError(
      `Viva ${init.method ?? 'GET'} ${path} failed (${res.status})`,
      res.status,
      json ?? text.slice(0, 500),
    )
  }
  return json
}

/* ---- 2. create payment order --------------------------------------------- */

/**
 * @param {object} p
 * @param {number} p.amountCents  total to charge, in cents (Viva wants minor units)
 * @param {string} p.ref          our own order reference → merchantTrns
 * @param {string} p.customerTrns short description shown to the customer
 * @param {object} p.customer     { email, fullName, phone, countryCode, requestLang }
 * @returns {Promise<{orderCode:string, redirectUrl:string}>}
 */
export async function createPaymentOrder({ amountCents, ref, customerTrns, customer }) {
  if (!Number.isInteger(amountCents) || amountCents < 30) {
    throw new VivaError('amountCents must be an integer of at least 30 (€0.30)', 400)
  }

  const payload = {
    amount: amountCents, // MINOR UNITS — 3500 = €35.00
    customerTrns,
    customer: {
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone || undefined,
      countryCode: customer.countryCode || 'CY',
      requestLang: customer.requestLang === 'el' ? 'el-GR' : 'en-US',
    },
    paymentTimeout: Number(process.env.VIVA_PAYMENT_TIMEOUT ?? 1800), // 30 min
    preauth: false, // capture immediately; true = authorise now, capture later
    allowRecurring: false,
    maxInstallments: 0,
    paymentNotification: true, // Viva emails the customer a receipt
    disableExactAmount: false,
    disableCash: true, // hide Viva's own cash/DIAS voucher option
    disableWallet: false, // KEEP FALSE — this is what enables Apple Pay / Google Pay
    sourceCode: process.env.VIVA_SOURCE_CODE || 'Default',
    merchantTrns: ref,
    tags: ['fitnessmaniacs', 'web'],
  }

  const json = await apiFetch('/checkout/v2/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  // Store as a STRING: orderCode is 16 digits and overflows JS number precision
  const orderCode = String(json.orderCode ?? '')
  if (!/^\d{10,20}$/.test(orderCode)) {
    throw new VivaError('Viva did not return a usable orderCode', 502, json)
  }

  const url = new URL(`${hosts().checkout}/web/checkout`)
  url.searchParams.set('ref', orderCode)
  if (process.env.VIVA_CHECKOUT_COLOR) {
    url.searchParams.set('color', process.env.VIVA_CHECKOUT_COLOR.replace('#', ''))
  }

  return { orderCode, redirectUrl: url.toString() }
}

/* ---- 5. verify the transaction ------------------------------------------- */

/** Viva statusId values we care about. 'F' = payment finished/captured. */
export const PAID_STATUSES = new Set(['F'])

/**
 * Ask Viva what actually happened. This is authoritative — never trust the
 * query string on the return redirect, which the customer can edit.
 * @returns {Promise<{paid:boolean, amountCents:number, statusId:string, raw:object}>}
 */
export async function retrieveTransaction(transactionId) {
  if (!/^[0-9a-fA-F-]{16,64}$/.test(String(transactionId ?? ''))) {
    throw new VivaError('Malformed transactionId', 400)
  }

  const raw = await apiFetch(`/checkout/v2/transactions/${transactionId}`)
  const statusId = String(raw?.statusId ?? '')

  return {
    paid: PAID_STATUSES.has(statusId),
    statusId,
    amountCents: Math.round(Number(raw?.amount ?? 0)),
    currencyCode: Number(raw?.currencyCode ?? 0),
    orderCode: String(raw?.orderCode ?? ''),
    merchantTrns: raw?.merchantTrns ?? null,
    email: raw?.email ?? null,
    fullName: raw?.fullName ?? null,
    cardNumber: raw?.cardNumber ?? null,
    insDate: raw?.insDate ?? null,
    raw,
  }
}

/* ---- webhook verification key -------------------------------------------- */

/**
 * Viva verifies a new webhook URL by GETting it and expecting {"Key": "..."}.
 * The key itself is fetched from Viva with BASIC auth using the *Merchant*
 * credentials (Merchant ID + API key), which are different from the Smart
 * Checkout OAuth credentials.
 */
export async function webhookVerificationKey() {
  const merchantId = process.env.VIVA_MERCHANT_ID
  const apiKey = process.env.VIVA_API_KEY
  if (!merchantId || !apiKey) {
    throw new VivaError(
      'VIVA_MERCHANT_ID / VIVA_API_KEY are not set — needed only for webhook verification.',
      500,
    )
  }

  const basic = Buffer.from(`${merchantId}:${apiKey}`).toString('base64')
  const res = await fetch(`${hosts().api}/api/messages/config/token`, {
    headers: { Authorization: `Basic ${basic}` },
  })

  const text = await res.text()
  if (!res.ok) {
    throw new VivaError(`Viva webhook-key request failed (${res.status})`, res.status, text.slice(0, 300))
  }
  const json = JSON.parse(text)
  if (!json.Key) throw new VivaError('Viva webhook-key response had no Key', 502, json)
  return json.Key
}
