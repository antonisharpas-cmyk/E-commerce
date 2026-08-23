import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getOrder } from '../lib/api'
import { formatCents } from '../lib/pricing'
import { useI18n } from '../lib/i18n'
import { SHOP } from '../lib/shop'
import { btn } from '../components/ui'
import { IconCheck, IconClock, IconPhone, IconPin, IconTruck, IconX } from '../components/Icons'

/* How each stored status is presented. Anything not listed falls back to
   "we're checking" rather than claiming success or failure. */
const STATUS = {
  paid: { tone: 'good', icon: IconCheck, key: 'ord.paid' },
  awaiting_fulfilment: { tone: 'good', icon: IconCheck, key: 'ord.placed' },
  pending_payment: { tone: 'wait', icon: IconClock, key: 'ord.pending' },
  payment_cancelled: { tone: 'bad', icon: IconX, key: 'ord.cancelled' },
  payment_failed: { tone: 'bad', icon: IconX, key: 'ord.failed' },
  payment_setup_failed: { tone: 'bad', icon: IconX, key: 'ord.failed' },
  held_amount_mismatch: { tone: 'wait', icon: IconClock, key: 'ord.review' },
}

const TONES = {
  good: { ring: 'border-brand/45', bg: 'bg-brand', fg: 'text-ink', head: 'text-brand' },
  wait: { ring: 'border-gold/45', bg: 'bg-gold', fg: 'text-ink', head: 'text-gold' },
  bad: { ring: 'border-[#ff6b6b]/45', bg: 'bg-[#ff6b6b]', fg: 'text-ink', head: 'text-[#ff9d9d]' },
}

export default function OrderStatus() {
  const { ref } = useParams()
  const [params] = useSearchParams()
  const { t, lang } = useI18n()

  const [state, setState] = useState({ loading: true, order: null, error: null })
  const [tries, setTries] = useState(0)

  const fmt = (c) => formatCents(c, lang === 'el' ? 'el-GR' : 'en-GB')

  useEffect(() => {
    let alive = true
    if (!ref) {
      setState({ loading: false, order: null, error: 'NOT_FOUND' })
      return
    }
    /* /order/failed is what Viva's Failure URL lands on when we could not even
       identify which order the customer was paying for. */
    if (ref === 'failed') {
      setState({ loading: false, order: null, error: 'PAYMENT_FAILED' })
      return
    }
    getOrder(ref).then((res) => {
      if (!alive) return
      if (res.ok) setState({ loading: false, order: res.data.order, error: null })
      else setState({ loading: false, order: null, error: res.error })
    })
    return () => {
      alive = false
    }
  }, [ref, tries])

  /* If the return redirect couldn't verify in time, or the webhook is still
     in flight, poll a few times before giving up. */
  useEffect(() => {
    const pending =
      params.get('verify') === 'pending' || state.order?.status === 'pending_payment'
    if (!pending || tries >= 5) return
    const id = setTimeout(() => setTries((n) => n + 1), 2500)
    return () => clearTimeout(id)
  }, [params, state.order, tries])

  if (state.loading) {
    return (
      <div className="container-x py-28 text-center">
        <p className="text-[14px] text-muted">{t('ord.loading')}</p>
      </div>
    )
  }

  if (!state.order) {
    const offline = state.error === 'NETWORK'
    const declined = state.error === 'PAYMENT_FAILED'
    return (
      <div className="container-x flex flex-col items-center py-28 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-line text-muted">
          <IconX width={28} height={28} />
        </span>
        <h1 className="mt-6 text-[2rem]">
          {t(declined ? 'ord.failed.t' : offline ? 'ord.offline' : 'ord.notFound')}
        </h1>
        <p className="mt-3 max-w-md text-[13.5px] text-muted">
          {t(declined ? 'ord.failed.d' : offline ? 'ord.offlineBody' : 'ord.notFoundBody')}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={`tel:${SHOP.phoneRaw}`} className={btn.ghost}>
            <IconPhone width={16} height={16} /> {SHOP.phone}
          </a>
          <Link to={declined ? '/checkout' : '/shop'} className={btn.primary}>
            {t(declined ? 'ord.retry' : 'cart.emptyCta')}
          </Link>
        </div>
      </div>
    )
  }

  const o = state.order
  const meta = STATUS[o.status] ?? { tone: 'wait', icon: IconClock, key: 'ord.pending' }
  const tone = TONES[meta.tone]
  const Icon = meta.icon
  const collecting = o.fulfilment === 'pickup_paid' || o.fulfilment === 'pickup_unpaid'

  return (
    <div className="container-x max-w-3xl py-14">
      <div className={`rounded-[18px] border ${tone.ring} bg-ink-2 p-8 sm:p-10`}>
        <div className="flex items-start gap-4">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${tone.bg} ${tone.fg}`}>
            <Icon width={26} height={26} />
          </span>
          <div>
            <h1 className={`text-[clamp(1.7rem,4vw,2.4rem)] ${tone.head}`}>{t(`${meta.key}.t`)}</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{t(`${meta.key}.d`)}</p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-[10.5px] font-bold tracking-[0.2em] text-gold uppercase">{t('ord.ref')}</dt>
            <dd className="display mt-1 text-[22px]">{o.ref}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-bold tracking-[0.2em] text-gold uppercase">{t('cart.total')}</dt>
            <dd className="display mt-1 text-[22px]">{fmt(o.totalCents)}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-bold tracking-[0.2em] text-gold uppercase">{t('ord.method')}</dt>
            <dd className="mt-1.5 text-[13.5px]">{t(`ful.${o.fulfilment}.t`)}</dd>
          </div>
        </dl>

        {/* what happens next */}
        <div className="mt-7 rounded-xl border border-line bg-ink p-5">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
            {collecting ? <IconPin width={15} height={15} /> : <IconTruck width={15} height={15} />}
            {t('ord.next')}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-chalk/90">{t(`ord.next.${o.fulfilment}`)}</p>
          {collecting && (
            <p className="mt-2.5 text-[12.5px] text-muted">
              {SHOP.address} · {t('contact.hours.week')} {SHOP.hours.week}
            </p>
          )}
        </div>

        <ul className="mt-7 space-y-2.5 border-t border-line pt-6">
          {o.lines.map((l, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 text-[13px]">
              <span className="text-muted">
                <span className="font-semibold text-chalk">{l.qty}×</span> {l.name}
                {[l.size, l.flavour].filter(Boolean).length
                  ? ` (${[l.size, l.flavour].filter(Boolean).join(', ')})`
                  : ''}
              </span>
              <span className="shrink-0 font-semibold">{fmt(l.lineCents)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-[12.5px]">
          <div className="flex justify-between">
            <dt className="text-muted">{t('cart.subtotal')}</dt>
            <dd>{fmt(o.itemsCents)}</dd>
          </div>
          {o.deliveryCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">{t('cart.shipping')}</dt>
              <dd>{fmt(o.deliveryCents)}</dd>
            </div>
          )}
          {o.surchargeCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">{t('checkout.codFee')}</dt>
              <dd>{fmt(o.surchargeCents)}</dd>
            </div>
          )}
          <div className="flex justify-between text-[11.5px] text-muted">
            <dt>{t('checkout.vatIncl', { rate: 19 })}</dt>
            <dd>{fmt(o.vatCents)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          {(meta.tone === 'bad' || o.status === 'pending_payment') && (
            <Link to="/checkout" className={btn.primary}>
              {t('ord.retry')}
            </Link>
          )}
          <a href={`tel:${SHOP.phoneRaw}`} className={btn.ghost}>
            <IconPhone width={16} height={16} /> {t('ord.callUs')}
          </a>
          <Link to="/shop" className={btn.ghost}>
            {t('ord.keepShopping')}
          </Link>
        </div>
      </div>

      <p className="mt-5 text-center text-[11.5px] text-muted">{t('ord.keepRef', { ref: o.ref })}</p>
    </div>
  )
}
