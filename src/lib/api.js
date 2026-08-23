/* Thin fetch wrapper around /api. Every call returns
   { ok, data } | { ok:false, error, detail, status } — never throws, so the UI
   can always render something sensible. */

async function call(path, init) {
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    const text = await res.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      return { ok: false, status: res.status, error: 'BAD_RESPONSE' }
    }
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.error ?? 'REQUEST_FAILED', detail: data?.detail }
    }
    return { ok: true, data }
  } catch {
    // network down, dev API not running, adblocker, offline laptop…
    return { ok: false, status: 0, error: 'NETWORK' }
  }
}

export const getConfig = () => call('/api/config')

export const getOrder = (ref) => call(`/api/order?ref=${encodeURIComponent(ref)}`)

/** Send only WHAT was ordered. The server prices it. */
export const startCheckout = ({ lines, fulfilment, customer, lang }) =>
  call('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({
      lines: lines.map((l) => ({ id: l.id, size: l.size, flavour: l.flavour, qty: l.qty })),
      fulfilment,
      customer,
      lang,
    }),
  })
