import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { SHOP } from '../lib/shop'
import { Reveal, btn } from '../components/ui'
import {
  IconCheck,
  IconClock,
  IconFacebook,
  IconInstagram,
  IconMail,
  IconPhone,
  IconPin,
  IconWhatsApp,
} from '../components/Icons'

function InfoCard({ icon: Icon, label, children }) {
  return (
    <div className="rounded-[14px] border border-line bg-ink-2 p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon width={19} height={19} />
      </span>
      <p className="mt-4 text-[10.5px] font-bold tracking-[0.2em] text-gold uppercase">{label}</p>
      <div className="mt-1.5 text-[14px] leading-relaxed text-chalk">{children}</div>
    </div>
  )
}

export default function Contact() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)

  return (
    <div className="container-x py-12">
      <div className="border-b border-line pb-8">
        <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-brand uppercase">
          <span className="h-px w-7 bg-brand" />
          {t('nav.contact')}
        </p>
        <h1 className="text-[clamp(2.2rem,5.5vw,3.6rem)]">{t('contact.title')}</h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{t('contact.sub')}</p>
      </div>

      <div className="grid gap-4 pt-9 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal>
          <InfoCard icon={IconPin} label={t('contact.address')}>
            {SHOP.address}
            <a
              href={SHOP.maps}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 block text-[12.5px] font-semibold text-brand hover:text-gold"
            >
              {t('contact.directions')} →
            </a>
          </InfoCard>
        </Reveal>
        <Reveal delay={80}>
          <InfoCard icon={IconPhone} label={t('contact.phone')}>
            <a href={`tel:${SHOP.phoneRaw}`} className="hover:text-brand">
              {SHOP.phone}
            </a>
            <a
              href={SHOP.whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-brand hover:text-gold"
            >
              <IconWhatsApp width={15} height={15} /> {t('contact.whatsapp')}
            </a>
          </InfoCard>
        </Reveal>
        <Reveal delay={160}>
          <InfoCard icon={IconMail} label={t('contact.email')}>
            <a href={`mailto:${SHOP.email}`} className="break-all hover:text-brand">
              {SHOP.email}
            </a>
            <div className="mt-3 flex gap-2">
              {[
                [SHOP.facebook, IconFacebook, 'Facebook'],
                [SHOP.instagram, IconInstagram, 'Instagram'],
              ].map(([href, Icon, name]) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={name}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:border-brand hover:text-brand"
                >
                  <Icon width={17} height={17} />
                </a>
              ))}
            </div>
          </InfoCard>
        </Reveal>
        <Reveal delay={240}>
          <InfoCard icon={IconClock} label={t('contact.hours')}>
            <ul className="space-y-1 text-[13.5px]">
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t('contact.hours.week')}</span>
                <span>{SHOP.hours.week}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t('contact.hours.sat')}</span>
                <span>{SHOP.hours.sat}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t('contact.hours.sun')}</span>
                <span className="text-gold">{t('contact.hours.closed')}</span>
              </li>
            </ul>
          </InfoCard>
        </Reveal>
      </div>

      {/* form + map */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <div className="h-full rounded-[14px] border border-line bg-ink-2 p-7">
            <h2 className="text-[24px]">{t('contact.form.title')}</h2>
            {sent ? (
              <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-ink">
                  <IconCheck width={26} height={26} />
                </span>
                <p className="text-[15px] font-semibold">{t('contact.form.sent')}</p>
                <p className="text-[12px] text-muted">{t('contact.form.demo')}</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
                className="mt-6 space-y-3.5"
              >
                <input
                  required
                  placeholder={t('contact.form.name')}
                  className="h-12 w-full rounded-xl border border-line bg-ink px-4 text-[14px] text-chalk outline-none focus:border-brand"
                  aria-label={t('contact.form.name')}
                />
                <input
                  required
                  type="email"
                  placeholder={t('contact.form.email')}
                  className="h-12 w-full rounded-xl border border-line bg-ink px-4 text-[14px] text-chalk outline-none focus:border-brand"
                  aria-label={t('contact.form.email')}
                />
                <textarea
                  required
                  rows={5}
                  placeholder={t('contact.form.msg')}
                  className="w-full resize-none rounded-xl border border-line bg-ink px-4 py-3 text-[14px] text-chalk outline-none focus:border-brand"
                  aria-label={t('contact.form.msg')}
                />
                <button type="submit" className={`${btn.primary} w-full`}>
                  {t('contact.form.send')}
                </button>
                <p className="text-center text-[11px] text-muted">{t('contact.form.demo')}</p>
              </form>
            )}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative h-full min-h-[380px] overflow-hidden rounded-[14px] border border-line bg-ink-2">
            <iframe
              title="K2 Fitness Maniacs — Meneou, Larnaca"
              src="https://www.openstreetmap.org/export/embed.html?bbox=33.585%2C34.845%2C33.635%2C34.875&layer=mapnik&marker=34.860%2C33.610"
              className="absolute inset-0 h-full w-full opacity-90 grayscale-[35%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-6 pt-16">
              <p className="display text-[20px]">{SHOP.name}</p>
              <p className="mt-1 text-[13px] text-muted">{SHOP.address}</p>
            </div>
            <a
              href={SHOP.maps}
              target="_blank"
              rel="noreferrer noopener"
              className={`${btn.gold} absolute top-4 right-4`}
            >
              {t('contact.directions')}
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
