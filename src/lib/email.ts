/* ============================================================================
 * Transactional email — spec section 42.
 *
 * Provider-agnostic on purpose: the shop will likely change provider at least
 * once, and the OTP flow must not be coupled to a vendor SDK. `send()` is the
 * only thing the rest of the codebase calls.
 *
 * With no EMAIL_API_KEY set, mail is written to the log instead. That keeps
 * registration testable end to end on a laptop with nothing to sign up for —
 * and in development the OTP is printed so you can complete the flow.
 * ========================================================================== */

import { BRAND } from '@/config/brand'

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}

export type SendResult =
  | { sent: true; providerId?: string }
  | { sent: false; reason: 'NO_PROVIDER' | 'PROVIDER_ERROR'; detail?: string }

const PROVIDER = process.env.EMAIL_PROVIDER ?? 'resend'
const API_KEY = process.env.EMAIL_API_KEY
const FROM = process.env.EMAIL_FROM ?? `${BRAND.name} <no-reply@example.com>`

export const emailEnabled = Boolean(API_KEY)

/* ------------------------------------------------------------------ send --- */

export async function send(message: EmailMessage): Promise<SendResult> {
  if (!API_KEY) {
    /* Not an error in development — it is the documented fallback. */
    console.info(
      `\n──── email (not sent: EMAIL_API_KEY is unset) ────\n` +
        `to:      ${message.to}\n` +
        `subject: ${message.subject}\n\n${message.text}\n` +
        `─────────────────────────────────────────────────\n`,
    )
    return { sent: false, reason: 'NO_PROVIDER' }
  }

  try {
    if (PROVIDER === 'resend') return await sendViaResend(message)
    return { sent: false, reason: 'PROVIDER_ERROR', detail: `Unknown provider "${PROVIDER}"` }
  } catch (err) {
    /* A failed email must never fail the request that triggered it. An order
       that is paid for but whose confirmation email bounced is still an order. */
    console.error('[email] send threw:', err instanceof Error ? err.message : err)
    return { sent: false, reason: 'PROVIDER_ERROR' }
  }
}

async function sendViaResend(message: EmailMessage): Promise<SendResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
      reply_to: message.replyTo,
    }),
  })

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300)
    console.error('[email] resend rejected the message', res.status, detail)
    return { sent: false, reason: 'PROVIDER_ERROR', detail }
  }

  const body = (await res.json().catch(() => null)) as { id?: string } | null
  return { sent: true, providerId: body?.id }
}

/* --------------------------------------------------------------- templates -- */

/* Plain text first. Every one of these is a message a customer needs to be able
   to read and act on, including in a client that blocks HTML. */

const layout = (body: string) =>
  `${body}\n\n—\n${BRAND.name}\n${BRAND.contact.email} · ${BRAND.contact.phone}\n`

export const templates = {
  verificationCode(code: string, expiresInMinutes: number) {
    return {
      subject: `${code} is your ${BRAND.name} verification code`,
      text: layout(
        `Your verification code is ${code}\n\n` +
          `Enter it to finish creating your account. It expires in ${expiresInMinutes} minutes.\n\n` +
          `If you did not try to create an account, you can ignore this email — ` +
          `nothing has been created.`,
      ),
    }
  },

  passwordReset(code: string, expiresInMinutes: number) {
    return {
      subject: `Reset your ${BRAND.name} password`,
      text: layout(
        `Your password reset code is ${code}\n\n` +
          `It expires in ${expiresInMinutes} minutes and can be used once.\n\n` +
          `If you did not ask to reset your password, ignore this email and your ` +
          `password stays as it is.`,
      ),
    }
  },

  orderReceived(args: { orderNumber: string; total: string; trackUrl: string; firstName: string }) {
    return {
      subject: `Order ${args.orderNumber} received`,
      text: layout(
        `Thanks ${args.firstName}, we have your order.\n\n` +
          `Order:  ${args.orderNumber}\n` +
          `Total:  ${args.total}\n\n` +
          `Track it any time: ${args.trackUrl}\n\n` +
          `We will email you again when it is on its way.`,
      ),
    }
  },

  paymentConfirmed(args: { orderNumber: string; total: string; trackUrl: string }) {
    return {
      subject: `Payment received for ${args.orderNumber}`,
      text: layout(
        `Payment of ${args.total} received for order ${args.orderNumber}.\n\n` +
          `We are preparing it now.\n\n${args.trackUrl}`,
      ),
    }
  },

  orderShipped(args: { orderNumber: string; trackUrl: string; eta?: string }) {
    return {
      subject: `Order ${args.orderNumber} has shipped`,
      text: layout(
        `Your order ${args.orderNumber} is on its way.` +
          (args.eta ? `\n\nEstimated arrival: ${args.eta}` : '') +
          `\n\n${args.trackUrl}`,
      ),
    }
  },

  readyForPickup(args: { orderNumber: string; address: string; hours: string }) {
    return {
      subject: `Order ${args.orderNumber} is ready to collect`,
      text: layout(
        `Your order ${args.orderNumber} is ready.\n\n` +
          `Collect from:\n${args.address}\n\nOpen: ${args.hours}\n\n` +
          `Bring your order number.`,
      ),
    }
  },

  orderDelivered(args: { orderNumber: string }) {
    return {
      subject: `Order ${args.orderNumber} delivered`,
      text: layout(
        `Your order ${args.orderNumber} has been marked as delivered.\n\n` +
          `Something not right? Reply to this email and we will sort it.`,
      ),
    }
  },

  orderCancelled(args: { orderNumber: string; refunded?: string }) {
    return {
      subject: `Order ${args.orderNumber} cancelled`,
      text: layout(
        `Order ${args.orderNumber} has been cancelled.` +
          (args.refunded
            ? `\n\nA refund of ${args.refunded} is on its way back to your card. ` +
              `Banks usually take 5–10 working days to show it.`
            : ''),
      ),
    }
  },
}

/* ------------------------------------------------------------- convenience -- */

export async function sendVerificationCode(to: string, code: string, ttlSeconds: number) {
  const t = templates.verificationCode(code, Math.round(ttlSeconds / 60))
  return send({ to, ...t })
}

export async function sendPasswordResetCode(to: string, code: string, ttlSeconds: number) {
  const t = templates.passwordReset(code, Math.round(ttlSeconds / 60))
  return send({ to, ...t })
}
