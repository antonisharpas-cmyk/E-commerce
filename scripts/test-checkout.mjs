/* ==========================================================================
   End-to-end checks against a running API (npm run dev, or npm run dev:api).
       node scripts/test-checkout.mjs
   Exits non-zero on the first failure. No test framework, no dependencies.

   These are the checks that matter for a shop taking money: that the server
   prices the order itself, that it refuses nonsense, and that a forged webhook
   cannot mark an order paid.
   ========================================================================== */

const BASE = process.env.TEST_BASE ?? `http://localhost:${process.env.API_PORT ?? 3001}`

let pass = 0
const failures = []

function check(name, condition, detail) {
  if (condition) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    failures.push({ name, detail })
    console.log(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : '')
  }
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function get(path) {
  const res = await fetch(BASE + path)
  return { status: res.status, body: await res.json().catch(() => null) }
}

const CUSTOMER = {
  fullName: 'Andreas Test',
  email: 'andreas@example.com',
  phone: '+357 99123456',
  address: '12 Arch. Makarios Ave',
  city: 'Larnaca',
  postcode: '7000',
}

const line = (id, qty = 1) => ({ id, qty })

console.log(`\nTesting ${BASE}\n`)

/* ---- config -------------------------------------------------------------- */
console.log('config')
const cfg = await get('/api/config')
check('GET /api/config returns 200', cfg.status === 200, cfg)
check('sandbox by default (never production by accident)', cfg.body?.vivaEnv !== 'production', cfg.body?.vivaEnv)
check('all four fulfilment methods offered', cfg.body?.fulfilment?.length === 4, cfg.body?.fulfilment)

/* ---- pricing is server-side --------------------------------------------- */
/* Priced via /api/quote so these assertions hold with or without Viva
   credentials — pricing is our logic, not the provider's. */
console.log('\npricing')

const q = (lines, fulfilment) => post('/api/quote', { lines, fulfilment })

// ASL Isolate is €35.00 → 3500 cents. Under €50, so delivery is charged.
const a = await q([line('asl-isolate-90')], 'delivery')
check('quote returns 200', a.status === 200, a)
check('delivery under €50 → 3500 + 450', a.body?.quote?.totalCents === 3950, a.body?.quote?.totalCents)

// Beast Whey €60 = 6000, over the threshold → delivery free.
const b = await q([line('asl-beast-whey-2kg')], 'delivery')
check('free delivery over €50', b.body?.quote?.totalCents === 6000, b.body?.quote?.totalCents)
check('delivery line is zero, not absent', b.body?.quote?.deliveryCents === 0, b.body?.quote?.deliveryCents)

// Pickup: no delivery fee even under €50
const cq = await q([line('asl-isolate-90')], 'pickup_unpaid')
check('pickup has no delivery fee', cq.body?.quote?.totalCents === 3500, cq.body?.quote?.totalCents)
check('pickup is flagged as offline payment', cq.body?.quote?.paysOnline === false, cq.body?.quote?.paysOnline)

// COD: delivery fee + €2 surcharge
const dq = await q([line('asl-isolate-90')], 'cod')
check('COD → 3500 + 450 + 200', dq.body?.quote?.totalCents === 4150, dq.body?.quote?.totalCents)

// Multi-line and quantity maths
const multi = await q([line('asl-isolate-90', 2), line('mp-creatine-500g', 3)], 'pickup_paid')
check('multi-line total = 2×3500 + 3×3000 = 16000', multi.body?.quote?.totalCents === 16000, multi.body?.quote?.totalCents)
check('item count sums quantities', multi.body?.quote?.itemCount === 5, multi.body?.quote?.itemCount)

// VAT is extracted from the gross, never added on top
check(
  'VAT is inclusive: net + VAT === total',
  multi.body?.quote?.netCents + multi.body?.quote?.vatCents === multi.body?.quote?.totalCents,
  multi.body?.quote,
)

/* ---- real orders (no provider needed for the offline paths) ------------- */
console.log('\noffline orders')

const c = await post('/api/checkout', {
  lines: [line('asl-isolate-90')],
  fulfilment: 'pickup_unpaid',
  customer: { ...CUSTOMER, address: '', city: '' },
})
check('pickup order accepted without an address', c.status === 200, c)
check('pickup total = 3500', c.body?.totalCents === 3500, c.body?.totalCents)
check('pickup is an offline order', c.body?.mode === 'offline', c.body?.mode)

const codOrder = await post('/api/checkout', {
  lines: [line('asl-isolate-90')],
  fulfilment: 'cod',
  customer: CUSTOMER,
})
check('COD order accepted', codOrder.status === 200, codOrder.status)
check('COD stored total = 4150', codOrder.body?.totalCents === 4150, codOrder.body?.totalCents)

/* ---- card path degrades gracefully when unconfigured ------------------- */
console.log('\ncard path')

const card = await post('/api/checkout', {
  lines: [line('asl-isolate-90')],
  fulfilment: 'delivery',
  customer: CUSTOMER,
})

if (cfg.body?.paymentsConfigured) {
  check('card checkout returns a Viva redirect', card.status === 200 && card.body?.mode === 'viva', card)
  check(
    'redirect points at the Viva checkout host',
    /vivapayments\.com\/web\/checkout\?ref=\d+/.test(card.body?.redirectUrl ?? ''),
    card.body?.redirectUrl,
  )
  check('order code kept as a string', typeof card.body?.orderCode === 'string', typeof card.body?.orderCode)
} else {
  console.log('    (VIVA_CLIENT_ID not set — asserting graceful refusal instead)')
  check('unconfigured card checkout → 503, not a crash', card.status === 503, card.status)
  check(
    'error names the real cause, not a generic provider failure',
    card.body?.error === 'PAYMENTS_NOT_CONFIGURED',
    card.body,
  )
  check('config advertises that cards are off', cfg.body?.paymentsConfigured === false, cfg.body?.paymentsConfigured)

  const wh = await get('/api/webhook')
  check('webhook handshake fails cleanly without merchant creds', wh.status === 503, wh.status)
  check('webhook error is explicit', wh.body?.error === 'WEBHOOK_KEY_UNAVAILABLE', wh.body)

  // the offline paths must be entirely unaffected by missing card credentials
  const stillWorks = await post('/api/checkout', {
    lines: [line('asl-isolate-90')],
    fulfilment: 'cod',
    customer: CUSTOMER,
  })
  check('COD unaffected by missing card credentials', stillWorks.status === 200, stillWorks.status)
}

/* ---- the security-critical one ------------------------------------------ */
console.log('\ntampering')

const tampered = await post('/api/checkout', {
  lines: [{ id: 'asl-isolate-90', qty: 1, price: 0.01, unitCents: 1, lineCents: 1 }],
  fulfilment: 'pickup_unpaid',
  customer: { ...CUSTOMER, address: '', city: '' },
  totalCents: 1,
  itemsCents: 1,
})
check(
  'client-supplied prices are ignored (still €35.00)',
  tampered.body?.totalCents === 3500,
  tampered.body?.totalCents,
)

const negative = await post('/api/checkout', {
  lines: [{ id: 'asl-isolate-90', qty: -5 }],
  fulfilment: 'pickup_unpaid',
  customer: { ...CUSTOMER, address: '', city: '' },
})
check('negative quantity rejected', negative.status === 400 && negative.body?.error === 'BAD_QUANTITY', negative)

const huge = await post('/api/checkout', {
  lines: [{ id: 'asl-isolate-90', qty: 9999 }],
  fulfilment: 'pickup_unpaid',
  customer: { ...CUSTOMER, address: '', city: '' },
})
check('absurd quantity rejected', huge.status === 400, huge)

const overStock = await post('/api/checkout', {
  lines: [{ id: 'asl-isolate-90', qty: 15 }], // stock is 8
  fulfilment: 'pickup_unpaid',
  customer: { ...CUSTOMER, address: '', city: '' },
})
check('over-stock rejected', overStock.body?.error === 'INSUFFICIENT_STOCK', overStock.body)

const ghost = await post('/api/checkout', {
  lines: [line('does-not-exist')],
  fulfilment: 'delivery',
  customer: CUSTOMER,
})
check('unknown product rejected', ghost.body?.error === 'UNKNOWN_PRODUCT', ghost.body)

const badMethod = await post('/api/checkout', {
  lines: [line('asl-isolate-90')],
  fulfilment: 'free_stuff_please',
  customer: CUSTOMER,
})
check('unknown fulfilment rejected', badMethod.body?.error === 'BAD_FULFILMENT', badMethod.body)

const empty = await post('/api/checkout', { lines: [], fulfilment: 'delivery', customer: CUSTOMER })
check('empty cart rejected', empty.body?.error === 'EMPTY_CART', empty.body)

/* ---- validation ---------------------------------------------------------- */
console.log('\nvalidation')

const badCustomer = await post('/api/checkout', {
  lines: [line('asl-isolate-90')],
  fulfilment: 'delivery',
  customer: { fullName: 'A', email: 'nope', phone: '1' },
})
check('bad customer → 422', badCustomer.status === 422, badCustomer.status)
check('per-field errors returned', Boolean(badCustomer.body?.detail?.email), badCustomer.body?.detail)

const missingAddress = await post('/api/checkout', {
  lines: [line('asl-isolate-90')],
  fulfilment: 'delivery',
  customer: { ...CUSTOMER, address: '', city: '' },
})
check('delivery without an address → 422', missingAddress.status === 422, missingAddress.status)

/* ---- order lookup -------------------------------------------------------- */
console.log('\norder lookup')

const ref = c.body?.ref
check('order reference looks right', /^FM-[23456789A-HJ-NP-Z]{6}$/.test(ref ?? ''), ref)

const fetched = await get(`/api/order?ref=${ref}`)
check('order retrievable', fetched.status === 200, fetched.status)
check('stored total matches', fetched.body?.order?.totalCents === 3500, fetched.body?.order?.totalCents)
check('offline order awaits fulfilment', fetched.body?.order?.status === 'awaiting_fulfilment', fetched.body?.order?.status)
check('VAT extracted from gross (3500 → 559)', fetched.body?.order?.vatCents === 559, fetched.body?.order?.vatCents)
check(
  'customer address is NOT exposed publicly',
  fetched.body?.order?.customer === undefined && fetched.body?.order?.lines?.[0]?.unitCents === undefined,
  Object.keys(fetched.body?.order ?? {}),
)

const badRef = await get('/api/order?ref=../../etc/passwd')
check('malformed ref rejected', badRef.status === 400, badRef.status)

const noRef = await get('/api/order?ref=FM-ZZZZZZ')
check('unknown ref → 404', noRef.status === 404, noRef.status)

/* ---- forged webhook must not settle an order ---------------------------- */
console.log('\nwebhook')

const forged = await post('/api/webhook', {
  EventTypeId: 1796,
  EventData: {
    TransactionId: '11111111-2222-3333-4444-555555555555',
    MerchantTrns: ref,
    OrderCode: '1234567890123456',
    Amount: 1,
    StatusId: 'F',
  },
})
check('forged webhook does not return success', forged.status !== 200 || forged.body?.status !== 'paid', forged)

const stillUnpaid = await get(`/api/order?ref=${ref}`)
check(
  'order was NOT marked paid by the forged webhook',
  stillUnpaid.body?.order?.status !== 'paid',
  stillUnpaid.body?.order?.status,
)

const irrelevant = await post('/api/webhook', { EventTypeId: 9999, EventData: {} })
check('unhandled event acknowledged with 200', irrelevant.status === 200, irrelevant.status)

/* ---- method guards ------------------------------------------------------- */
console.log('\nmethod guards')
const wrongMethod = await get('/api/checkout')
check('GET /api/checkout → 405', wrongMethod.status === 405, wrongMethod.status)

/* ---- summary ------------------------------------------------------------- */
console.log(`\n${'─'.repeat(52)}`)
if (failures.length === 0) {
  console.log(`  ${pass} checks passed.\n`)
  process.exit(0)
}
console.log(`  ${pass} passed, ${failures.length} FAILED:`)
for (const f of failures) console.log(`    • ${f.name} ${f.detail ? JSON.stringify(f.detail) : ''}`)
console.log('')
process.exit(1)
