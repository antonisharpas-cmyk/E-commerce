'use client'

/* ============================================================================
 * A product's photos, in order — drag to change which one leads.
 *
 * The first photo is the one on every product card and at the top of the
 * product page. The second is the one a card fades to when the pointer is
 * over it. Saved the moment you let go; a failed save puts them back.
 * ========================================================================== */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DragHandle, Sortable } from './Sortable'

type Photo = { id: string; url: string }

const ROLE = ['Main photo', 'On hover']

export function PhotoOrder({ productId, photos }: { productId: string; photos: Photo[] }) {
  const router = useRouter()
  const [order, setOrder] = useState(photos)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function save(next: Photo[]) {
    const previous = order
    setOrder(next)
    setStatus('saving')
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!res.ok || !data.ok) throw new Error(data.message ?? 'Could not save that order.')
      setStatus('saved')
      router.refresh()
    } catch (err) {
      setOrder(previous)
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not save that order.')
    }
  }

  if (order.length === 0) {
    return <p className="text-sm text-muted">This product has no photos yet.</p>
  }

  return (
    <div>
      <Sortable
        items={order}
        getId={(p) => p.id}
        describe={(p) => `Photo ${order.indexOf(p) + 1}`}
        onChange={save}
        className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        renderItem={(photo, { index, dragging, handle }) => (
          <figure className={`h-full border bg-paper p-2 ${dragging ? 'border-ink' : 'border-line'}`}>
            <div className="relative aspect-4/5 overflow-hidden bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" draggable={false} className="h-full w-full select-none object-cover" />
              <div className="absolute top-1.5 left-1.5">
                <DragHandle handle={handle} className="bg-paper/90 backdrop-blur-sm" />
              </div>
            </div>
            <figcaption className={`mt-2 text-xs ${index < 2 ? 'font-medium' : 'text-muted'}`}>
              {ROLE[index] ?? `Photo ${index + 1}`}
            </figcaption>
          </figure>
        )}
      />
      <p
        aria-live="polite"
        className={`mt-3 h-5 text-sm ${status === 'error' ? 'text-sale' : 'text-muted'}`}
      >
        {status === 'saving' && 'Saving…'}
        {status === 'saved' && '✓ Saved — the shop shows this order now'}
        {status === 'error' && `Not saved: ${message}`}
      </p>
    </div>
  )
}
