/* Small shared pieces for the admin screens. Server-safe: no hooks. */

import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHead({
  title,
  sub,
  action,
}: {
  title: string
  sub?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  tone = 'plain',
  href,
}: {
  label: string
  value: ReactNode
  tone?: 'plain' | 'warn' | 'bad'
  href?: string
}) {
  const body = (
    <div
      className={`border bg-paper p-5 transition-colors ${
        tone === 'bad'
          ? 'border-sale/50'
          : tone === 'warn'
            ? 'border-amber-500/50'
            : 'border-line'
      } ${href ? 'hover:border-ink' : ''}`}
    >
      <p className="label text-muted">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${
          tone === 'bad' ? 'text-sale' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} className="label px-4 py-3 text-left text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-line)]">{children}</tbody>
      </table>
    </div>
  )
}

export function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'off'; children: ReactNode }) {
  const tones = {
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-amber-500/15 text-amber-700',
    bad: 'bg-sale/10 text-sale',
    off: 'bg-paper-2 text-muted',
  }
  return <span className={`inline-block rounded-sm px-2 py-1 label ${tones[tone]}`}>{children}</span>
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-line bg-paper px-6 py-16 text-center text-sm text-muted">
      {children}
    </div>
  )
}
