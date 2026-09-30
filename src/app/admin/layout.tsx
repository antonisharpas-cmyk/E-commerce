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
import { assertSchemaReady } from '@/db/ready'
import { inboxCounts } from '@/lib/support'
import { SignOutButton } from '@/components/auth/SignOutButton'
import '../globals.css'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  /* Never in a search index, never followed. */
  robots: { index: false, follow: false, nocache: true },
}

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/homepage', label: 'Homepage' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/support', label: 'Customer service' },
  { href: '/admin/emails', label: 'Marketing & Emails' },
  { href: '/admin/settings', label: 'Settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /* Before anything reads a table: on this machine's database, new code's
     migrations are applied here rather than surfacing as a failed query. */
  await assertSchemaReady()
  const user = await guardAdmin()
  /* The one live number in the nav: conversations waiting for a reply. */
  const support = await inboxCounts().catch(() => ({ open: 0, unread: 0 }))

  return (
    <html lang="en">
      <body className="min-h-screen bg-paper-2">
        <header className="border-b border-line bg-paper">
          <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
            <Link href="/admin" className="text-lg font-semibold tracking-[0.2em]">
              {BRAND.name}
            </Link>
            <span className="label rounded-sm bg-ink px-2 py-1 text-paper">Admin</span>

            <nav
              aria-label="Admin"
              className="order-last -mx-5 flex w-[calc(100%+2.5rem)] gap-x-6 overflow-x-auto px-5 pb-1 md:order-none md:mx-0 md:w-auto md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="label shrink-0 whitespace-nowrap text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                  {item.href === '/admin/support' && support.unread > 0 && (
                    <span className="ml-1.5 rounded-full bg-sale px-1.5 py-0.5 text-[10px] text-paper" aria-label={`${support.unread} waiting`}>
                      {support.unread}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-5 text-sm">
              <span className="hidden text-muted lg:inline">
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
