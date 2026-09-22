/* ============================================================================
 * Registration, step 1 — spec section 9.
 *
 * Takes the details, checks the email and phone are free, hashes the password,
 * parks the whole thing on a one-time code and emails the code. NO user row is
 * created here: an unverified signup leaves nothing behind but an OTP row that
 * expires in ten minutes.
 *
 * The response never says whether the code was correct, never returns the code,
 * and never echoes the password.
 * ========================================================================== */

import { z } from 'zod'
import { OtpError, OTP_TTL_SECONDS, issueRegistrationOtp } from '@/lib/auth/otp'
import { sendVerificationCode } from '@/lib/email'
import { registerSchema } from '@/lib/validation'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return json({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    /* Field-level messages, so the form can put each one next to its input. */
    const tree = z.treeifyError(parsed.error)
    return json({ ok: false, error: 'INVALID_INPUT', fields: tree }, 422)
  }

  try {
    const { code, expiresAt } = await issueRegistrationOtp(parsed.data)

    /* In development EMAIL_PROVIDER=console prints the code to the terminal —
       that is how you finish a signup without a mail service configured. */
    await sendVerificationCode(parsed.data.email, code, OTP_TTL_SECONDS)

    return json({
      ok: true,
      email: parsed.data.email,
      expiresAt,
      ttlSeconds: OTP_TTL_SECONDS,
    })
  } catch (err) {
    if (err instanceof OtpError) {
      /* EMAIL_TAKEN / PHONE_TAKEN / RATE_LIMITED / COOLDOWN — each already
         carries a message a customer can act on. */
      const status = err.code === 'RATE_LIMITED' || err.code === 'COOLDOWN' ? 429 : 409
      return json(
        { ok: false, error: err.code, message: err.message, retryAfter: err.retryAfterSeconds },
        status,
      )
    }
    console.error('[api/auth/register] failed', err)
    return json({ ok: false, error: 'REGISTRATION_FAILED', message: 'Something went wrong.' }, 500)
  }
}
