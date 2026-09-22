/* ============================================================================
 * The admin panel, over real HTTP — spec section 40 (roles) and 41 (admin).
 *
 *     npm run check:admin      (needs the dev server: npm run dev)
 *
 * This is the check that matters most, because everything else in the shop is
 * a feature and this is a door. It proves, against a running server rather
 * than against my reading of the code:
 *
 *   · a signed-out visitor cannot see an admin page, and is sent to sign in;
 *   · a signed-in CUSTOMER gets 404 from every admin page and every admin API,
 *     the same answer a stranger gets, so the panel does not announce itself;
 *   · a customer's write attempts change nothing in the database;
 *   · an admin can actually get in and make the three kinds of change;
 *   · stock cannot be set below what live carts are holding;
 *   · a settings change reaches the storefront immediately.
 *
 * It creates its own two accounts and puts every value it touched back.
 * ========================================================================== */

import './load-env'

import { eq, sql } from 'drizzle-orm'
import { db, pool } from '../src/db'
import { inventory, productVariants, products, users } from '../src/db/schema'
import { hashPassword } from '../src/lib/auth/password'
import { getSettings, setSetting, SETTING_DEFAULTS } from '../src/lib/settings'

const BASE = process.env.CHECK_BASE ?? 'http://localhost:3100'
const PASSWORD = 'Check-Admin-Pass-92!'

const PAGES = ['/admin', '/admin/products', '/admin/stock', '/admin/settings']

/* ------------------------------------------------------------- plumbing -- */

type Reply = { status: number; location: string | null; text: string; json: unknown }

function visitor() {
  let cookie = ''
  async function call(method: string, path: string, body?: unknown): Promise<Reply> {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      /* Manual, always. Following a redirect turns a rejection into a 200 and
         makes a broken guard look like a working one — which is exactly the
         mistake this script exists to stop me repeating. */
      redirect: 'manual',
    })
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const pair = c.split(';')[0]
      const name = pair.split('=')[0]
      cookie = cookie
        .split('; ')
        .filter((p) => p && p.split('=')[0] !== name)
        .concat(pair)
        .join('; ')
    }
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = undefined
    }
    return { status: res.status, location: res.headers.get('location'), text, json: parsed }
  }
  return {
    get: (p: string) => call('GET', p),
    post: (p: string, b?: unknown) => call('POST', p, b),
    patch: (p: string, b?: unknown) => call('PATCH', p, b),
    signedIn: () => /sf_session=[^;]/.test(cookie),
  }
}

let failures = 0
function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? '✓' : '✗'} ${label}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log('       ', JSON.stringify(detail)?.slice(0, 400))
  }
}
const head = (s: string) => console.log(`\n${s}`)

const message = (r: Reply) =>
  typeof r.json === 'object' && r.json !== null && 'message' in r.json
    ? String((r.json as { message?: unknown }).message)
    : undefined

/* ----------------------------------------------------------------- main -- */

async function main() {
  const stamp = Date.now()
  const adminEmail = `check-admin-${stamp}@example.com`
  const customerEmail = `check-customer-${stamp}@example.com`

  /* Reachability first, with a clear instruction rather than a stack trace. */
  try {
    await fetch(BASE + '/en', { redirect: 'manual' })
  } catch {
    console.error(`\n✗ nothing is answering on ${BASE}.\n  Start the site first:  npm run dev -- -p 3100\n`)
    process.exitCode = 1
    return
  }

  const hash = await hashPassword(PASSWORD)
  await db.insert(users).values([
    {
      email: adminEmail,
      phone: `+3579${String(stamp).slice(-7)}`,
      passwordHash: hash,
      firstName: 'Check',
      lastName: 'Admin',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
    {
      email: customerEmail,
      phone: `+3578${String(stamp).slice(-7)}`,
      passwordHash: hash,
      firstName: 'Check',
      lastName: 'Customer',
      role: 'CUSTOMER',
      emailVerifiedAt: new Date(),
    },
  ])

  /* A variant with stock, and its product, to experiment on. */
  const [target] = await db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
    })
    .from(productVariants)
    .innerJoin(inventory, eq(inventory.variantId, productVariants.id))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(sql`${inventory.onHand} - ${inventory.reserved} >= 3`)
    .limit(1)

  if (!target) {
    console.error('\n✗ no variant with at least 3 available — run npm run db:seed first.\n')
    await db.delete(users).where(sql`${users.email} in (${adminEmail}, ${customerEmail})`)
    process.exitCode = 1
    return
  }

  const settingsBefore = await getSettings(
    Object.keys(SETTING_DEFAULTS) as (keyof typeof SETTING_DEFAULTS)[],
  )

  const stranger = visitor()
  const customer = visitor()
  const admin = visitor()

  /* ------------------------------------------------- signed out: pages -- */

  head('A stranger')
  for (const p of PAGES) {
    const r = await stranger.get(p)
    check(
      `${p} is not served — sent to sign in`,
      r.status === 307 && (r.location ?? '').startsWith('/en/sign-in'),
      { status: r.status, location: r.location },
    )
  }
  for (const p of PAGES) {
    const r = await stranger.get(p)
    check(`${p} leaks nothing of the page itself`, !r.text.includes('Needs restocking'), r.text.slice(0, 120))
  }

  head('A stranger calling the admin API directly')
  const strangerWrites: [string, Reply][] = [
    ['POST /api/admin/stock', await stranger.post('/api/admin/stock', { variantId: target.variantId, onHand: 999 })],
    [
      `PATCH /api/admin/products/:id`,
      await stranger.patch(`/api/admin/products/${target.productId}`, {
        priceCents: 100,
        salePriceCents: null,
        isActive: true,
      }),
    ],
    ['PATCH /api/admin/settings', await stranger.patch('/api/admin/settings', { ...settingsBefore })],
  ]
  for (const [label, r] of strangerWrites) {
    check(`${label} → 404, not 401 (the endpoint does not admit it exists)`, r.status === 404, r.status)
  }

  /* --------------------------------------------------- customer: pages -- */

  head('A signed-in customer')
  const custLogin = await customer.post('/api/auth/login', { email: customerEmail, password: PASSWORD })
  check('signs in normally', custLogin.status === 200 && customer.signedIn(), custLogin.status)

  const account = await customer.get('/en/account')
  check('can reach their own account page', account.status === 200, account.status)

  for (const p of PAGES) {
    const r = await customer.get(p)
    check(`${p} → 404 (not a redirect, not "forbidden")`, r.status === 404, {
      status: r.status,
      location: r.location,
    })
  }

  const custStock = await customer.post('/api/admin/stock', {
    variantId: target.variantId,
    onHand: 4242,
  })
  const custProduct = await customer.patch(`/api/admin/products/${target.productId}`, {
    priceCents: 1,
    salePriceCents: null,
    isActive: false,
  })
  const custSettings = await customer.patch('/api/admin/settings', {
    ...settingsBefore,
    max_qty_per_line: 999,
  })
  check('cannot write stock (404)', custStock.status === 404, custStock.status)
  check('cannot write a price (404)', custProduct.status === 404, custProduct.status)
  check('cannot write settings (404)', custSettings.status === 404, custSettings.status)

  const [afterCustomer] = await db
    .select({ onHand: inventory.onHand })
    .from(inventory)
    .where(eq(inventory.variantId, target.variantId))
  const [productAfterCustomer] = await db
    .select({ priceCents: products.priceCents, isActive: products.isActive })
    .from(products)
    .where(eq(products.id, target.productId))
  const settingsAfterCustomer = await getSettings(['max_qty_per_line'])

  check('and nothing they tried actually changed: stock', afterCustomer?.onHand === target.onHand, {
    was: target.onHand,
    now: afterCustomer?.onHand,
  })
  check(
    'nothing changed: price and visibility',
    productAfterCustomer?.priceCents === target.priceCents && productAfterCustomer?.isActive === true,
    productAfterCustomer,
  )
  check(
    'nothing changed: settings',
    settingsAfterCustomer.max_qty_per_line === settingsBefore.max_qty_per_line,
    settingsAfterCustomer,
  )

  /* ------------------------------------------------------ admin: pages -- */

  head('The shop owner')
  const adminLogin = await admin.post('/api/auth/login', { email: adminEmail, password: PASSWORD })
  check('signs in', adminLogin.status === 200 && admin.signedIn(), adminLogin.status)

  const expected: Record<string, string> = {
    '/admin': 'Needs restocking',
    '/admin/products': 'Products',
    '/admin/stock': 'Held in carts',
    '/admin/settings': 'Free delivery over',
  }
  for (const p of PAGES) {
    const r = await admin.get(p)
    check(`${p} opens and is the real page`, r.status === 200 && r.text.includes(expected[p]), {
      status: r.status,
      sawMarker: r.text.includes(expected[p]),
    })
  }

  const noIndex = await admin.get('/admin')
  check(
    'the panel asks search engines to stay out',
    /noindex/i.test(noIndex.text),
    noIndex.text.match(/<meta[^>]*robots[^>]*>/i)?.[0],
  )

  /* -------------------------------------------------------- admin: stock -- */

  head('Stock')
  const newOnHand = target.onHand + 7
  const setOk = await admin.post('/api/admin/stock', {
    variantId: target.variantId,
    onHand: newOnHand,
  })
  const [stored] = await db
    .select({ onHand: inventory.onHand, reserved: inventory.reserved })
    .from(inventory)
    .where(eq(inventory.variantId, target.variantId))
  check('an admin can set the count on the shelf', setOk.status === 200, setOk.json)
  check('and the database holds exactly that number', stored?.onHand === newOnHand, {
    expected: newOnHand,
    stored: stored?.onHand,
  })

  const bad = await admin.post('/api/admin/stock', { variantId: target.variantId, onHand: -1 })
  check('a negative count is refused (422)', bad.status === 422, bad.status)
  const notAnId = await admin.post('/api/admin/stock', { variantId: 'not-a-uuid', onHand: 5 })
  check('a malformed id is refused (422), not a 500', notAnId.status === 422, notAnId.status)

  /* Put units into a real customer cart, then try to set stock below them. */
  const shopper = visitor()
  const reserve = await shopper.post('/api/cart', { variantId: target.variantId, quantity: 2 })
  check('a shopper can put 2 in their bag', reserve.status === 200, reserve.json)

  const below = await admin.post('/api/admin/stock', { variantId: target.variantId, onHand: 1 })
  const [afterRefusal] = await db
    .select({ onHand: inventory.onHand })
    .from(inventory)
    .where(eq(inventory.variantId, target.variantId))
  check(
    'stock cannot be set below what live carts hold (409)',
    below.status === 409,
    { status: below.status, body: below.json },
  )
  check(
    'the refusal explains itself in words a shop owner can act on',
    /held in customer carts/i.test(message(below) ?? ''),
    message(below),
  )
  check('and the stored count is untouched by the refusal', afterRefusal?.onHand === newOnHand, {
    expected: newOnHand,
    stored: afterRefusal?.onHand,
  })

  /* ----------------------------------------------------- admin: product -- */

  head('Prices')
  const newPrice = target.priceCents + 500
  const priced = await admin.patch(`/api/admin/products/${target.productId}`, {
    priceCents: newPrice,
    salePriceCents: null,
    isActive: true,
  })
  const [pricedRow] = await db
    .select({ priceCents: products.priceCents, salePriceCents: products.salePriceCents })
    .from(products)
    .where(eq(products.id, target.productId))
  check('an admin can change a price', priced.status === 200, priced.json)
  check('the stored price is the one that was sent', pricedRow?.priceCents === newPrice, pricedRow)

  const upsideDown = await admin.patch(`/api/admin/products/${target.productId}`, {
    priceCents: newPrice,
    salePriceCents: newPrice + 100,
    isActive: true,
  })
  const [afterUpsideDown] = await db
    .select({ salePriceCents: products.salePriceCents })
    .from(products)
    .where(eq(products.id, target.productId))
  check('a sale price above the normal price is refused (422)', upsideDown.status === 422, upsideDown.status)
  check('and was not written', afterUpsideDown?.salePriceCents === null, afterUpsideDown)

  const ghost = await admin.patch('/api/admin/products/00000000-0000-4000-8000-000000000000', {
    priceCents: 1000,
    salePriceCents: null,
    isActive: true,
  })
  check('a product that does not exist gives 404', ghost.status === 404, ghost.status)

  /* ---------------------------------------------------- admin: settings -- */

  head('Settings reach the shop')
  const tighten = await admin.patch('/api/admin/settings', {
    ...settingsBefore,
    max_qty_per_line: 1,
  })
  check('an admin can save settings', tighten.status === 200, tighten.json)

  const overLimit = visitor()
  const refused = await overLimit.post('/api/cart', { variantId: target.variantId, quantity: 2 })
  check(
    'the storefront obeys the new limit on the very next request',
    refused.status === 409,
    { status: refused.status, body: refused.json },
  )
  const allowed = await overLimit.post('/api/cart', { variantId: target.variantId, quantity: 1 })
  check('one is still allowed', allowed.status === 200, allowed.json)

  const nonsense = await admin.patch('/api/admin/settings', {
    ...settingsBefore,
    reservation_ttl_seconds: 5,
  })
  check('a 5-second cart hold is refused (422)', nonsense.status === 422, nonsense.status)
  const prefix = await admin.patch('/api/admin/settings', {
    ...settingsBefore,
    order_number_prefix: 'not lower case',
  })
  check('a malformed order prefix is refused (422)', prefix.status === 422, prefix.status)

  /* ------------------------------------------------------------ tidy up -- */

  head('Putting everything back')
  await overLimit.post('/api/cart', { variantId: target.variantId, quantity: 0 })
  await shopper.post('/api/cart', { variantId: target.variantId, quantity: 0 })

  for (const [key, value] of Object.entries(settingsBefore)) {
    await setSetting(key as keyof typeof SETTING_DEFAULTS, value as never)
  }
  await db
    .update(products)
    .set({ priceCents: target.priceCents, salePriceCents: target.salePriceCents })
    .where(eq(products.id, target.productId))
  await db
    .update(inventory)
    .set({ onHand: target.onHand })
    .where(eq(inventory.variantId, target.variantId))
  await db.delete(users).where(sql`${users.email} in (${adminEmail}, ${customerEmail})`)

  const [restored] = await db
    .select({ onHand: inventory.onHand })
    .from(inventory)
    .where(eq(inventory.variantId, target.variantId))
  const [restoredProduct] = await db
    .select({ priceCents: products.priceCents })
    .from(products)
    .where(eq(products.id, target.productId))
  const restoredSettings = await getSettings(['max_qty_per_line'])
  check('stock restored', restored?.onHand === target.onHand, restored)
  check('price restored', restoredProduct?.priceCents === target.priceCents, restoredProduct)
  check(
    'settings restored',
    restoredSettings.max_qty_per_line === settingsBefore.max_qty_per_line,
    restoredSettings,
  )

  if (failures === 0) {
    console.log('\n✓ the admin panel is closed to everyone who is not an admin, and works for one\n')
  } else {
    console.log(`\n✗ ${failures} check(s) failed\n`)
    process.exitCode = 1
  }
}

main()
  .catch((err) => {
    console.error('✗ check failed to run:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
