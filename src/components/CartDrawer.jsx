import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FREE_DELIVERY_AT, useCart } from '../lib/cart'
import { money, useI18n } from '../lib/i18n'
import ProductArt from './ProductArt'
import { IconCheck, IconTruck, IconX } from './Icons'
import { btn } from './ui'

export default function CartDrawer() {
  const cart = useCart()
  const { t } = useI18n()
  const [done, setDone] = useState(false)

  if (!cart.open) return null

  const remaining = Math.max(0, FREE_DELIVERY_AT - cart.subtotal)
  const progress = Math.min(100, (cart.subtotal / FREE_DELIVERY_AT) * 100)

  const close = () => {
    cart.setOpen(false)
    setDone(false)
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t('cart.title')}>
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} aria-label={t('nav.close')} />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-line bg-ink-2">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[20px]">
            {t('cart.title')}{' '}
            {cart.count > 0 && <span className="text-brand">({cart.count})</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-chalk hover:border-brand hover:text-brand"
            aria-label={t('nav.close')}
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        {/* free-delivery meter */}
        {cart.count > 0 && (
          <div className="border-b border-line px-5 py-3.5">
            <p className="flex items-center gap-2 text-[12px] font-semibold">
              <IconTruck width={16} height={16} className={remaining ? 'text-muted' : 'text-brand'} />
              {remaining > 0 ? (
                <span className="text-muted">{t('cart.freeAt', { n: remaining.toFixed(2) })}</span>
              ) : (
                <span className="text-brand">{t('cart.freeYes')}</span>
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* lines */}
        <div className="flex-1 overflow-y-auto">
          {done ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-ink">
                <IconCheck width={30} height={30} />
              </span>
              <p className="display text-[22px]">{t('contact.form.sent')}</p>
              <p className="text-[13px] text-muted">{t('cart.demo')}</p>
            </div>
          ) : cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
              <p className="text-[14px] text-muted">{t('cart.empty')}</p>
              <Link to="/shop" onClick={close} className={btn.primary}>
                {t('cart.emptyCta')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex gap-3.5 px-5 py-4">
                  <Link
                    to={`/product/${l.id}`}
                    onClick={close}
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-ink"
                  >
                    <ProductArt product={l.product} className="h-full w-full" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-chalk">{l.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {[l.size, l.flavour].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => cart.setQty(l.key, l.qty - 1)}
                          className="grid h-7 w-7 place-items-center text-muted hover:text-brand"
                          aria-label="−"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[12px] font-bold">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => cart.setQty(l.key, l.qty + 1)}
                          className="grid h-7 w-7 place-items-center text-muted hover:text-brand"
                          aria-label="+"
                        >
                          +
                        </button>
                      </div>
                      <span className="display text-[16px] text-gold">{money(l.product.price * l.qty)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.remove(l.key)}
                    className="self-start text-muted hover:text-chalk"
                    aria-label={t('cart.remove')}
                    title={t('cart.remove')}
                  >
                    <IconX width={15} height={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* totals */}
        {cart.lines.length > 0 && !done && (
          <div className="border-t border-line px-5 py-4">
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.subtotal')}</dt>
                <dd className="font-semibold">{money(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.shipping')}</dt>
                <dd className={cart.delivery === 0 ? 'font-semibold text-brand' : 'font-semibold'}>
                  {cart.delivery === 0 ? t('cart.free') : money(cart.delivery)}
                </dd>
              </div>
              <div className="flex items-end justify-between border-t border-line pt-2.5">
                <dt className="text-[11px] font-bold tracking-[0.2em] uppercase">{t('cart.total')}</dt>
                <dd className="display text-[26px] text-gold">{money(cart.total)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                setDone(true)
                cart.clear()
              }}
              className={`${btn.primary} mt-4 w-full`}
            >
              {t('cart.checkout')}
            </button>
            <p className="mt-2.5 text-center text-[10.5px] text-muted">{t('cart.demo')}</p>
          </div>
        )}
      </aside>
    </div>
  )
}
