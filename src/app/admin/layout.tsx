/* ============================================================================
 * The admin shell.
 *
 * Its own layout, OUTSIDE [locale]: this is a staff tool in one language, and
 * routing it through locale negotiation would only put /en/ in front of every
 * URL for no one's benefit. `src/proxy.ts` excludes /admin for the same reason.
 *
 * The guard runs HERE, so every page beneath it is protected by construction
 * rather than by each page remembering. Pages still call guardAdmin() for the
 * user object — it is cheap, and a page that reads it cannot be moved out from
 * under this layout and quietly lose its protection.
 * ========================================================================== */

import Link from 'next/link'
import type { Metadata } from 'next'
import { BRAND } from '@/config/brand'
import { guardAdmin } from '@/lib/admin'
import { SignOutButton } from '@/components/auth/SignOutButton'
import '../globals.css'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  /* Never in a search index, never followed. */
  robots: { index: false, follow: false, nocache: true },
}

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/settings', label: 'Settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await guardAdmin()

  return (
    <html lang="en">
      <body className="min-h-screen bg-paper-2">
        <header className="border-b border-line bg-paper">
          <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
            <Link href="/admin" className="text-lg font-semibold tracking-[0.2em]">
              {BRAND.name}
            </Link>
            <span className="label rounded-sm bg-ink px-2 py-1 text-paper">Admin</span>

            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="label text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-5 text-sm">
              <span className="text-muted">
                {user.firstName} {user.lastName}
                <span className="ml-2 label text-muted">{user.role.replace('_', ' ')}</span>
              </span>
              <Link href="/en" className="text-muted underline hover:text-ink">
                View shop
              </Link>
              <SignOutButton locale="en" />
            </div>
          </div>
        </header>

        <main className="container-x py-10">{children}</main>
      </body>
    </html>
  )
}
