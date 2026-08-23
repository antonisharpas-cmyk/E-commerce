/* ==========================================================================
   ORDER STORE

   Serverless functions have no durable local disk, so this is pluggable:

     • Upstash Redis  — used automatically when KV_REST_API_URL and
                        KV_REST_API_TOKEN are set (Vercel's KV integration
                        sets exactly these names for you).
     • in-memory Map  — the fallback. Fine for `npm run dev` and for the
                        pitch demo. On Vercel it means an order can vanish
                        when the instance is recycled.

   ⚠️  Viva's own dashboard is always the financial record of truth. This store
   is for showing the customer their confirmation page and for the shop's
   picking list — it is not accounting.
   ========================================================================== */

const TTL_SECONDS = 60 * 60 * 24 * 90 // keep orders queryable for 90 days

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
export const usingRedis = Boolean(url && token)

/* ---- in-memory fallback -------------------------------------------------- */
const memory = new Map()

/* ---- Upstash REST ------------------------------------------------------- */
async function redis(command) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) {
    throw new Error(`Redis command failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
  }
  const json = await res.json()
  return json.result
}

const key = (ref) => `order:${ref}`

export async function putOrder(order) {
  const record = { ...order, updatedAt: new Date().toISOString() }
  if (usingRedis) {
    await redis(['SET', key(order.ref), JSON.stringify(record), 'EX', String(TTL_SECONDS)])
    // secondary index so the return redirect can find an order by orderCode
    if (order.vivaOrderCode) {
      await redis(['SET', `viva:${order.vivaOrderCode}`, order.ref, 'EX', String(TTL_SECONDS)])
    }
  } else {
    memory.set(order.ref, record)
    if (order.vivaOrderCode) memory.set(`viva:${order.vivaOrderCode}`, order.ref)
  }
  return record
}

export async function getOrder(ref) {
  if (!ref) return null
  if (usingRedis) {
    const raw = await redis(['GET', key(ref)])
    return raw ? JSON.parse(raw) : null
  }
  return memory.get(ref) ?? null
}

export async function getOrderByVivaCode(orderCode) {
  if (!orderCode) return null
  const ref = usingRedis ? await redis(['GET', `viva:${orderCode}`]) : memory.get(`viva:${orderCode}`)
  return ref ? getOrder(ref) : null
}

export async function patchOrder(ref, patch) {
  const existing = await getOrder(ref)
  if (!existing) return null
  return putOrder({ ...existing, ...patch })
}

/** What the customer's confirmation page is allowed to see. Never leak the
 *  raw Viva payload, card metadata, or internal notes to the browser. */
export function publicView(order) {
  if (!order) return null
  return {
    ref: order.ref,
    status: order.status,
    fulfilment: order.fulfilment,
    totalCents: order.totalCents,
    itemsCents: order.itemsCents,
    deliveryCents: order.deliveryCents,
    surchargeCents: order.surchargeCents,
    vatCents: order.vatCents,
    currency: order.currency,
    lines: (order.lines ?? []).map((l) => ({
      name: l.name,
      size: l.size,
      flavour: l.flavour,
      qty: l.qty,
      lineCents: l.lineCents,
    })),
    customerName: order.customer?.fullName ?? null,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
  }
}
