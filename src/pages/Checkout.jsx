import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../lib/cart'
import { FULFILMENT, formatCents } from '../lib/pricing'
import { useI18n } from '../lib/i18n'
import { getConfig, startCheckout } from '../lib/api'
import { SHOP } from '../lib/shop'
import ProductArt from '../components/ProductArt'
import { btn } from '../components/ui'
import { IconArrow, IconPin, IconShield, IconTruck } from '../components/Icons'

const METHOD_ORDER = ['delivery', 'pickup_paid', 'pickup_unpaid', 'cod']

const EMPTY = { fullName: '', email: '', phone: '', address: '', city: '', postcode: '', notes: '' }

export default function Checkout() {
  const cart = useCart()
  const { t, lang } = useI18n()
  const nav = useNavigate()

  const [method, setMethod] = useState('delivery')
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [topError, setTopError] = useState(null)
  const [config, setConfig] = useState(null)

  const fmt = (c) => formatCents(c, lang === 'el' ? 'el-GR' : 'en-GB')

  useEffect(() => {
    let alive = true
    getConfig().then((r) => {
      if (!alive) return
      if (r.ok) setConfig(r.data)
      else setConfig({ offline: true })
    })
    return () => {
      alive = false
    }
  }, [])

  const available = useMemo(() => {
    const allowed = config?.fulfilment ?? METHOD_ORDER
    return METHOD_ORDER.filter((m) => allowed.includes(m))
  }, [config])

  useEffect(() => {
    if (available.length && !available.includes(method)) setMethod(available[0])
  }, [available, method])

  const priced = cart.priceFor(method)
  const needsAddress = FULFILMENT[method].needsAddress
  const paysOnline = FULFILMENT[method].paysOnline

  /* empty cart → nothing to do here */
  if (!priced) {
    return (
      <div className="container-x flex flex-col items-center py-28 text-center">
        <h1 className="text-[2.2rem]">{t('cart.empty')}</h1>
        <Link to="/shop" className={`${btn.primary} mt-6`}>
          {t('cart.emptyCta')}
        </Link>
      </div>
    )
  }

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: undefined } : fe))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setTopError(null)
    setFieldErrors({})

    const res = await startCheckout({
      lines: cart.lines,
      fulfilment: method,
      customer: form,
      lang,
    })

    if (!res.ok) {
      setSubmitting(false)
      if (res.error === 'INVALID_CUSTOMER' && res.detail) {
        setFieldErrors(res.detail)
        setTopError('checkout.err.fields')
        return
      }
      setTopError(
        {
          NETWORK: 'checkout.err.network',
          PAYMENT_PROVIDER_ERROR: 'checkout.err.provider',
          RATE_LIMITED: 'checkout.err.rate',
          INSUFFICIENT_STOCK: 'checkout.err.stock',
          EMPTY_CART: 'cart.empty',
        }[res.error] ?? 'checkout.err.generic',
      )
      return
    }

    if (res.data.mode === 'viva') {
      // hand the customer to Viva's hosted payment page
      window.location.assign(res.data.redirectUrl)
      return
    }

    cart.clear()
    nav(`/order/${res.data.ref}`)
  }

  const err = (k) =>
    fieldErrors[k] ? (
      <span className="mt-1 block text-[11px] font-semibold text-[#ff6b6b]">
        {t(fieldErrors[k] === 'INVALID' ? 'checkout.field.invalid' : 'checkout.field.required')}
      </span>
    ) : null

  const input = (k) =>
    `h-12 w-full rounded-xl border bg-ink px-4 text-[14px] text-chalk outline-none transition-colors ${
      fieldErrors[k] ? 'border-[#ff6b6b]' : 'border-line focus:border-brand'
    }`

  return (
    <div className="container-x py-12">
      <div className="border-b border-line pb-8">
        <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-brand uppercase">
          <span className="h-px w-7 bg-brand" />
          {t('checkout.step')}
        </p>
        <h1 className="text-[clamp(2.2rem,5.5vw,3.6rem)]">{t('checkout.title')}</h1>
      </div>

      {/* sandbox banner */}
      {config && config.vivaEnv !== 'production' && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold-soft px-5 py-4">
          <IconShield width={19} height={19} className="mt-0.5 shrink-0 text-gold" />
          <div>
            <p className="text-[13px] font-bold text-gold">{t('checkout.sandbox.title')}</p>
            <p className="mt-1 text-[12.5px] text-muted">{t('checkout.sandbox.body')}</p>
            <p className="mt-1.5 font-mono text-[12px] text-chalk">4147 4630 1111 0133 · any future expiry · any CVV</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-8 pt-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ---------------------------------------------------------- left */}
        <div>
          {/* fulfilment */}
          <h2 className="text-[20px]">{t('checkout.how')}</h2>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {available.map((id) => {
              const on = id === method
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  aria-pressed={on}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    on ? 'border-brand bg-brand-soft/50' : 'border-line bg-ink-2 hover:border-brand/50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={`text-[13.5px] font-bold ${on ? 'text-brand' : 'text-chalk'}`}>
                      {t(`ful.${id}.t`)}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-gold">
                      {FULFILMENT[id].surcharge
                        ? `+${fmt(FULFILMENT[id].surcharge)}`
                        : FULFILMENT[id].needsAddress
                          ? t('ful.shipTag')
                          : t('ful.freeTag')}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[12px] leading-relaxed text-muted">{t(`ful.${id}.d`)}</span>
                </button>
              )
            })}
          </div>

          {/* contact */}
          <h2 className="mt-10 text-[20px]">{t('checkout.contact')}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                {t('checkout.name')}
              </span>
              <input value={form.fullName} onChange={set('fullName')} className={input('fullName')} autoComplete="name" />
              {err('fullName')}
            </label>
            <label>
              <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                {t('checkout.email')}
              </span>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className={input('email')}
                autoComplete="email"
              />
              {err('email')}
            </label>
            <label>
              <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                {t('checkout.phone')}
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className={input('phone')}
                autoComplete="tel"
                placeholder="+357 …"
              />
              {err('phone')}
            </label>
          </div>

          {/* address */}
          {needsAddress ? (
            <>
              <h2 className="mt-10 text-[20px]">{t('checkout.address')}</h2>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-[2fr_1fr]">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                    {t('checkout.street')}
                  </span>
                  <input
                    value={form.address}
                    onChange={set('address')}
                    className={input('address')}
                    autoComplete="street-address"
                  />
                  {err('address')}
                </label>
                <label>
                  <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                    {t('checkout.city')}
                  </span>
                  <input
                    value={form.city}
                    onChange={set('city')}
                    className={input('city')}
                    autoComplete="address-level2"
                  />
                  {err('city')}
                </label>
                <label>
                  <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                    {t('checkout.postcode')}
                  </span>
                  <input
                    value={form.postcode}
                    onChange={set('postcode')}
                    className={input('postcode')}
                    autoComplete="postal-code"
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="mt-10 rounded-xl border border-line bg-ink-2 p-5">
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
                <IconPin width={15} height={15} /> {t('checkout.collectAt')}
              </p>
              <p className="mt-2 text-[14px] text-chalk">{SHOP.address}</p>
              <p className="mt-1 text-[12.5px] text-muted">
                {t('contact.hours.week')} {SHOP.hours.week} · {t('contact.hours.sat')} {SHOP.hours.sat}
              </p>
            </div>
          )}

          <label className="mt-6 block">
            <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
              {t('checkout.notes')}
            </span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={set('notes')}
              className="w-full resize-none rounded-xl border border-line bg-ink px-4 py-3 text-[14px] text-chalk outline-none focus:border-brand"
              placeholder={t('checkout.notesHint')}
            />
          </label>
        </div>

        {/* --------------------------------------------------------- right */}
        <aside className="lg:sticky lg:top-[150px] lg:self-start">
          <div className="rounded-[14px] border border-line bg-ink-2 p-6">
            <h2 className="text-[18px]">{t('checkout.summary')}</h2>

            <ul className="mt-4 space-y-3">
              {priced.lines.map((l) => (
                <li key={`${l.id}${l.size}${l.flavour}`} className="flex gap-3">
                  <span className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-ink">
                    <ProductArt product={cart.lines.find((c) => c.id === l.id)?.product ?? {}} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold">{l.name}</span>
                    <span className="block text-[11px] text-muted">
                      {l.qty} × {fmt(l.unitCents)}
                      {[l.size, l.flavour].filter(Boolean).length ? ` · ${[l.size, l.flavour].filter(Boolean).join(', ')}` : ''}
                    </span>
                  </span>
                  <span className="text-[12.5px] font-semibold">{fmt(l.lineCents)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.subtotal')}</dt>
                <dd>{fmt(priced.itemsCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.shipping')}</dt>
                <dd className={priced.deliveryCents ? '' : 'text-brand'}>
                  {priced.deliveryCents ? fmt(priced.deliveryCents) : t('cart.free')}
                </dd>
              </div>
              {priced.surchargeCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">{t('checkout.codFee')}</dt>
                  <dd>{fmt(priced.surchargeCents)}</dd>
                </div>
              )}
              <div className="flex items-end justify-between border-t border-line pt-3">
                <dt className="text-[11px] font-bold tracking-[0.2em] uppercase">{t('cart.total')}</dt>
                <dd className="display text-[30px] text-gold">{fmt(priced.totalCents)}</dd>
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <dt>{t('checkout.vatIncl', { rate: Math.round(priced.vatRate * 100) })}</dt>
                <dd>{fmt(priced.vatCents)}</dd>
              </div>
            </dl>

            {topError && (
              <p className="mt-4 rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-3.5 py-2.5 text-[12.5px] text-[#ff9d9d]">
                {t(topError)}
              </p>
            )}

            <button type="submit" disabled={submitting} className={`${btn.primary} mt-5 w-full`}>
              {submitting
                ? t('checkout.working')
                : paysOnline
                  ? `${t('checkout.pay')} ${fmt(priced.totalCents)}`
                  : t('checkout.place')}
              {!submitting && <IconArrow width={16} height={16} />}
            </button>

            <ul className="mt-4 space-y-2 text-[11.5px] text-muted">
              {paysOnline && (
                <li className="flex items-center gap-2">
                  <IconShield width={14} height={14} className="shrink-0 text-brand" />
                  {t('checkout.trust.viva')}
                </li>
              )}
              <li className="flex items-center gap-2">
                <IconTruck width={14} height={14} className="shrink-0 text-brand" />
                {needsAddress ? t('p.delivery') : t('p.pickup')}
              </li>
            </ul>

            {paysOnline && <p className="mt-3 text-[10.5px] leading-relaxed text-muted">{t('checkout.pciNote')}</p>}
          </div>

          <Link to="/shop" className="mt-4 block text-center text-[12.5px] text-muted hover:text-brand">
            ← {t('p.back')}
          </Link>
        </aside>
      </form>
    </div>
  )
}
