/* ============================================================================
 * Admin: the order of one product's photos.
 *
 *   PUT { ids: [uuid, …] }   — every photo of this product, first one first
 *
 * The first photo is the one on every product card and at the top of the
 * product page; the second is the one a card fades to on hover.
 * ========================================================================== */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AdminError, reorderProductImages, requireAdminApi } from '@/lib/admin'

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(40),
})

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi()
  if ('response' in guard) return guard.response

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) {
    return Response.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'INVALID_INPUT', message: 'That photo order was not valid.' },
      { status: 422 },
    )
  }

  try {
    await reorderProductImages(id, parsed.data.ids)
  } catch (err) {
    if (err instanceof AdminError) {
      return Response.json({ ok: false, error: 'INVALID_INPUT', message: err.message }, { status: 422 })
    }
    console.error('[api/admin/products/images] failed', err)
    return Response.json({ ok: false, error: 'SAVE_FAILED' }, { status: 500 })
  }

  /* Cards appear on every listing, so everything under the storefront. */
  revalidatePath('/[locale]', 'layout')
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
