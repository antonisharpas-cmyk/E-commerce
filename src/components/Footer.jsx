import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import { SHOP } from '../lib/shop'
import { LogoMark } from './Logo'
import { IconArrow, IconFacebook, IconInstagram, IconMail, IconPhone, IconPin, IconWhatsApp } from './Icons'

function Newsletter() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand-soft via-ink-2 to-ink-2 p-7 sm:p-9">
      <span className="pointer-events-none absolute -top-16 -right-10 h-52 w-52 rounded-full bg-brand/12 blur-3xl" />
      <div className="relative grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <h3 className="text-[clamp(1.5rem,3vw,2rem)]">{t('nl.title')}</h3>
          <p className="mt-2 max-w-md text-[13.5px] text-muted">{t('nl.sub')}</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            required
            placeholder={t('nl.placeholder')}
            className="h-12 min-w-0 flex-1 rounded-full border border-line bg-ink px-4 text-[13px] text-chalk outline-none focus:border-brand"
            aria-label={t('nl.placeholder')}
          />
          <button
            type="submit"
            className="grid h-12 shrink-0 place-items-center rounded-full bg-brand px-6 text-[12px] font-bold tracking-wider text-ink uppercase transition-colors hover:bg-[#00e076]"
          >
            {sent ? t('nl.done') : t('nl.cta')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Footer() {
  const { t, tf } = useI18n()

  const cols = [
    {
      title: t('foot.shop'),
      links: CATEGORIES.slice(0, 6).map((c) => [tf(c), `/shop?category=${c.slug}`]),
    },
    {
      title: t('foot.help'),
      links: [
        [t('foot.shipping'), '/contact'],
        [t('foot.returns'), '/contact'],
        [t('foot.support'), '/contact'],
        [t('nav.contact'), '/contact'],
      ],
    },
    {
      title: t('foot.company'),
      links: [
        [t('foot.about'), '/'],
        [t('nav.brands'), '/brands'],
        [t('foot.terms'), '/contact'],
        [t('foot.privacy'), '/contact'],
      ],
    },
  ]

  return (
    <footer className="mt-24 border-t border-line bg-ink-2/60">
      <div className="container-x -mt-14 pb-14">
        <Newsletter />
      </div>

      <div className="container-x grid gap-10 pb-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={38} />
            <span className="display text-[16px]">
              <span className="text-brand">FITNESS</span>
              <span className="text-gold"> MANIACS</span>
            </span>
          </div>
          <ul className="mt-5 space-y-2.5 text-[13px] text-muted">
            <li className="flex gap-2.5">
              <IconPin width={16} height={16} className="mt-0.5 shrink-0 text-brand" />
              {SHOP.address}
            </li>
            <li className="flex gap-2.5">
              <IconPhone width={16} height={16} className="mt-0.5 shrink-0 text-brand" />
              <a href={`tel:${SHOP.phoneRaw}`} className="hover:text-brand">
                {SHOP.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <IconMail width={16} height={16} className="mt-0.5 shrink-0 text-brand" />
              <a href={`mailto:${SHOP.email}`} className="hover:text-brand">
                {SHOP.email}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex gap-2">
            {[
              [SHOP.facebook, IconFacebook, 'Facebook'],
              [SHOP.instagram, IconInstagram, 'Instagram'],
              [SHOP.whatsapp, IconWhatsApp, 'WhatsApp'],
            ].map(([href, Icon, label]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-colors hover:border-brand hover:text-brand"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-[12px] tracking-[0.2em] text-gold">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map(([label, to]) => (
                <li key={label + to}>
                  <Link to={to} className="text-[13px] text-muted transition-colors hover:text-brand">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-5 text-[11.5px] text-muted">
          <p>
            © {new Date().getFullYear()} K2 Fitness Maniacs. {t('foot.rights')}
          </p>
          <p className="flex items-center gap-1.5 text-gold/80">
            <IconArrow width={13} height={13} />
            {t('foot.demoNote')}
          </p>
        </div>
      </div>
    </footer>
  )
}
