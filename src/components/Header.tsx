import Link from 'next/link'
import { BRAND, LOCALE_LABELS, LOCALES, type Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { t as tr } from '@/lib/catalog'
import type { CategoryNode } from '@/lib/catalog'
import { SearchBox } from './SearchBox'
import { MobileNav } from './MobileNav'

/* Server component. The two interactive pieces — search and the mobile drawer —
   are separate client components, so the header itself ships no JavaScript. */

export function Header({
  locale,
  categories,
  cartCount,
  signedIn,
}: {
  locale: Locale
  categories: CategoryNode[]
  cartCount: number
  signedIn: boolean
}) {
  const t = getTranslator(locale)
  const base = `/${locale}`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      {/* announcement strip — free delivery threshold comes from settings */}
      <div className="border-b border-line bg-ink text-paper">
        <div className="container-x flex h-9 items-center justify-center">
          <p className="label truncate">{t('footer.newsletter')}</p>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-4">
        <MobileNav locale={locale} categories={categories} />

        <Link href={base} className="shrink-0 text-lg font-semibold tracking-[0.18em]">
          {BRAND.name}
        </Link>

        {/* desktop nav */}
        <nav className="ml-6 hidden items-stretch gap-7 lg:flex" aria-label="Main">
          {categories.map((root) => (
            <div key={root.id} className="group relative flex items-center">
              <Link
                href={`${base}/${root.slug}`}
                className="label py-5 hover:text-ink-soft"
              >
                {tr(root.name, locale)}
              </Link>

              {root.children.length > 0 && (
                <div className="invisible absolute top-full left-0 min-w-56 border border-line bg-paper opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 focus-within:visible focus-within:opacity-100">
                  <ul className="py-2">
                    {root.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`${base}/${root.slug}/${child.slug}`}
                          className="block px-4 py-2 text-sm hover:bg-paper-2"
                        >
                          {tr(child.name, locale)}
                        </Link>
                      </li>
                    ))}
                    <li className="mt-1 border-t border-line pt-1">
                      <Link
                        href={`${base}/${root.slug}`}
                        className="block px-4 py-2 label hover:bg-paper-2"
                      >
                        {t('nav.allIn', { category: tr(root.name, locale) })}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchBox locale={locale} placeholder={t('nav.searchPlaceholder')} label={t('nav.search')} />

          {/* language switcher — a plain form so it works without JS */}
          <div className="hidden items-center gap-1 sm:flex" role="group" aria-label={t('nav.language')}>
            {LOCALES.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                hrefLang={code}
                aria-current={code === locale ? 'true' : undefined}
                className={`px-2 py-1 text-[11px] font-semibold uppercase ${
                  code === locale ? 'text-ink underline' : 'text-muted hover:text-ink'
                }`}
              >
                {code === 'el' ? 'ΕΛ' : code.toUpperCase()}
              </Link>
            ))}
          </div>

          <Link
            href={signedIn ? `${base}/account` : `${base}/sign-in`}
            className="hidden px-3 py-2 label text-ink-soft hover:text-ink sm:block"
          >
            {signedIn ? t('nav.account') : t('auth.signIn')}
          </Link>

          <Link
            href={`${base}/cart`}
            className="relative flex items-center gap-2 px-3 py-2 label hover:text-ink-soft"
          >
            {t('nav.bag')}
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold ${
                cartCount > 0 ? 'bg-ink text-paper' : 'bg-paper-2 text-muted'
              }`}
            >
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function Footer({ locale }: { locale: Locale }) {
  const t = getTranslator(locale)
  const base = `/${locale}`

  const columns: { title: string; links: [string, string][] }[] = [
    {
      title: t('footer.help'),
      links: [
        [t('footer.contact'), `${base}/contact`],
        [t('footer.trackOrder'), `${base}/track-order`],
        [t('footer.delivery'), `${base}/delivery`],
        [t('footer.returns'), `${base}/returns`],
      ],
    },
    {
      title: t('footer.about'),
      links: [
        [t('footer.terms'), `${base}/terms`],
        [t('footer.privacy'), `${base}/privacy`],
      ],
    },
  ]

  return (
    <footer className="mt-20 border-t border-line bg-paper-2">
      <div className="container-x grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-semibold tracking-[0.18em]">{BRAND.name}</p>
          <p className="mt-3 max-w-sm text-sm text-muted">
            {BRAND.contact.addressLines.join(', ')}
          </p>
          <p className="mt-2 text-sm text-muted">
            {BRAND.contact.email} · {BRAND.contact.phone}
          </p>
          <div className="mt-4 flex gap-2">
            {LOCALES.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                hrefLang={code}
                className="border border-line px-2.5 py-1 text-[11px] hover:border-ink"
              >
                {LOCALE_LABELS[code]}
              </Link>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="label mb-4 text-muted">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-wrap gap-2 py-5 text-xs text-muted">
          <p>
            © {new Date().getFullYear()} {BRAND.legal.companyName}. {t('footer.rights')}
          </p>
          <p className="ml-auto">
            {t('footer.vat')} {BRAND.legal.vatNumber} · Reg. {BRAND.legal.registrationNumber}
          </p>
        </div>
      </div>
    </footer>
  )
}
