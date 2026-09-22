/* ============================================================================
 * Admin: edit one product's price and visibility.
 *
 * Money arrives as integer cents and is validated as such. A sale price must be
 * genuinely lower than the price — a "sale" that is not a saving is the kind of
 * thing consumer-protection regulators fine shops for, so the server refuses it
 * rather than trusting the form to have checked.
 * ========================================================================== */

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { requireAdminApi } from '@/lib/admin'
import { invalidateSettingsCache } from '@/lib/settings'

const bodySchema = z
  .object({
    priceCents: z.number().int().min(0).max(100_000_000),
    salePriceCents: z.number().int().min(0).max(100_000_000).nullable(),
    isActive: z.boolean(),
  })
  .refine((v) => v.salePriceCents === null || v.salePriceCents < v.priceCents, {
    message: 'A sale price has to be lower than the normal price.',
    path: ['salePriceCents'],
  })

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi()
  if ('response' in guard) return guard.response

  const { id } = await context.params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: 'INVALID_INPUT',
        message: parsed.error.issues[0]?.message ?? 'That was not valid.',
      },
      { status: 422 },
    )
  }

  const [updated] = await db
    .update(products)
    .set({
      priceCents: parsed.data.priceCents,
      salePriceCents: parsed.data.salePriceCents,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning({ id: products.id })

  if (!updated) {
    return Response.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })
  }

  invalidateSettingsCache()
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
