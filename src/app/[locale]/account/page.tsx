/* ============================================================================
 * The account page.
 *
 * Deliberately small for now: who you are, and the way out. Orders, addresses
 * and the wishlist arrive with the phases that build them — an empty "Orders"
 * tab that can never fill is worse than no tab.
 * ========================================================================== */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BRAND, isLocale, type Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { getCurrentUser } from '@/lib/auth/session'
import { SignOutButton } from '@/components/auth/SignOutButton'

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : BRAND.market.defaultLocale) as Locale
  const t = getTranslator(locale)
  const base = `/${locale}`

  const user = await getCurrentUser()
  /* Send them to sign in, and back here afterwards. */
  if (!user) redirect(`${base}/sign-in?next=${encodeURIComponent(`${base}/account`)}`)

  return (
    <div className="container-x py-14">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.firstName ? `${t('nav.account')} — ${user.firstName}` : t('nav.account')}
        </h1>

        <dl className="mt-8 divide-y divide-[var(--color-line)] border-y border-line text-sm">
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-muted">{t('auth.email')}</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-muted">{t('auth.phone')}</dt>
            <dd>{user.phone}</dd>
          </div>
        </dl>

        <div className="mt-8 flex items-center gap-6">
          <Link href={base} className="text-sm text-muted underline hover:text-ink">
            {t('cart.continueShopping')}
          </Link>
          <SignOutButton locale={locale} />
        </div>
      </div>
    </div>
  )
}
