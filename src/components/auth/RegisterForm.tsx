'use client'

/* Registration: details, then the emailed code.
 *
 * Two steps in one component because they are one task to the person doing
 * them — and because the second step needs the email from the first. Nothing
 * is created until the code checks out, so abandoning at step two leaves no
 * account behind.
 *
 * Field errors come back from the server's own validation rather than being
 * re-implemented here: one definition of "valid phone number", not two. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { AuthCard, Field, FormError } from './Field'
import { button } from '@/components/ui'

type FieldErrors = Record<string, string | undefined>

/* Zod's treeified errors nest by field; pull out the first message for each. */
function flattenFieldErrors(tree: unknown): FieldErrors {
  const out: FieldErrors = {}
  const properties = (tree as { properties?: Record<string, { errors?: string[] }> })?.properties
  if (!properties) return out
  for (const [name, node] of Object.entries(properties)) {
    if (node?.errors?.length) out[name] = node.errors[0]
  }
  return out
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const t = getTranslator(locale)
  const router = useRouter()
  const base = `/${locale}`

  const [step, setStep] = useState<'details' | 'code'>('details')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    marketingConsent: false,
  })
  const [code, setCode] = useState('')
  const [fields, setFields] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  /* Countdown for the resend link, so the button is not offered while the
     server would refuse it anyway. */
  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        message?: string
        fields?: unknown
        retryAfter?: number
      }

      if (!res.ok || !data.ok) {
        if (data.fields) setFields(flattenFieldErrors(data.fields))
        else setError(data.message ?? t('err.generic'))
        setBusy(false)
        return
      }

      setStep('code')
      setResendIn(60)
    } catch {
      setError(t('err.network'))
    } finally {
      setBusy(false)
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      })
      const data = (await res.json()) as { ok?: boolean; message?: string }

      if (!res.ok || !data.ok) {
        setError(data.message ?? t('err.generic'))
        setBusy(false)
        return
      }

      router.push(`${base}/account`)
      router.refresh()
    } catch {
      setError(t('err.network'))
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      })
      const data = (await res.json()) as { ok?: boolean; message?: string; retryAfter?: number }
      if (!res.ok || !data.ok) setError(data.message ?? t('err.generic'))
      setResendIn(data.retryAfter ?? 60)
    } catch {
      setError(t('err.network'))
    } finally {
      setBusy(false)
    }
  }

  /* ------------------------------------------------------------- step two -- */
  if (step === 'code') {
    return (
      <AuthCard title={t('auth.verifyTitle')} sub={t('auth.verifyBody', { email: form.email })}>
        <form onSubmit={submitCode} className="space-y-5" noValidate>
          <FormError>{error}</FormError>

          <Field
            label={t('auth.code')}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="mt-2 w-full border border-line px-3.5 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-ink"
          />

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className={`${button.primary} w-full`}
          >
            {busy ? '…' : t('auth.verify')}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={resend}
            disabled={busy || resendIn > 0}
            className="text-muted underline hover:text-ink disabled:no-underline disabled:opacity-50"
          >
            {resendIn > 0 ? `${t('auth.resend')} (${resendIn}s)` : t('auth.resend')}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('details')
              setError(null)
              setCode('')
            }}
            className="text-muted underline hover:text-ink"
          >
            {t('auth.email')}
          </button>
        </div>
      </AuthCard>
    )
  }

  /* ------------------------------------------------------------- step one -- */
  return (
    <AuthCard title={t('auth.createAccount')}>
      <form onSubmit={submitDetails} className="space-y-5" noValidate>
        <FormError>{error}</FormError>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t('auth.firstName')}
            name="firstName"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={set('firstName')}
            error={fields.firstName}
          />
          <Field
            label={t('auth.lastName')}
            name="lastName"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={set('lastName')}
            error={fields.lastName}
          />
        </div>

        <Field
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={fields.email}
        />

        <Field
          label={t('auth.phone')}
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          value={form.phone}
          onChange={set('phone')}
          error={fields.phone}
          hint="+357 99 123456"
        />

        <Field
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set('password')}
          error={fields.password}
          hint="At least 10 characters."
        />

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(e) => setForm((f) => ({ ...f, marketingConsent: e.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink)]"
          />
          <span>
            {t('auth.marketingOptIn')}
            <span className="mt-0.5 block text-xs text-muted">{t('auth.marketingNote')}</span>
          </span>
        </label>

        <button type="submit" disabled={busy} className={`${button.primary} w-full`}>
          {busy ? '…' : t('auth.createAccount')}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link href={`${base}/sign-in`} className="text-ink underline hover:no-underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthCard>
  )
}
