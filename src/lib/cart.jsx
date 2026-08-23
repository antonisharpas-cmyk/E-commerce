import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { bySlug } from './catalog'
import { MAX_QTY_PER_LINE, quote } from './pricing'

/* The cart holds WHAT was ordered. Every money figure comes from quote() in
   pricing.js — the same function the API uses — so the drawer, the checkout
   page and the amount charged can never disagree. */

const CartContext = createContext(null)

const lineKey = (id, size, flavour) => [id, size || '-', flavour || '-'].join('::')

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { id, size, flavour, qty = 1 } = action
      const key = lineKey(id, size, flavour)
      const existing = state.find((l) => l.key === key)
      if (existing) {
        return state.map((l) =>
          l.key === key ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY_PER_LINE) } : l,
        )
      }
      return [...state, { key, id, size, flavour, qty: Math.min(qty, MAX_QTY_PER_LINE) }]
    }
    case 'setQty':
      return state
        .map((l) =>
          l.key === action.key ? { ...l, qty: Math.max(0, Math.min(action.qty, MAX_QTY_PER_LINE)) } : l,
        )
        .filter((l) => l.qty > 0)
    case 'remove':
      return state.filter((l) => l.key !== action.key)
    case 'clear':
      return []
    default:
      return state
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem('fm-cart')
    const parsed = raw ? JSON.parse(raw) : []
    // drop anything that no longer exists in the catalogue
    return Array.isArray(parsed) ? parsed.filter((l) => l?.id && bySlug(l.id)) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, null, readStored)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('fm-cart', JSON.stringify(lines))
    } catch {
      /* private mode — cart just won't survive a refresh */
    }
  }, [lines])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const value = useMemo(() => {
    const detailed = lines.map((l) => ({ ...l, product: bySlug(l.id) })).filter((l) => l.product)

    /** Price the cart for a given fulfilment method. Returns null when empty. */
    const priceFor = (fulfilment = 'delivery') => {
      if (detailed.length === 0) return null
      const result = quote(detailed, fulfilment)
      return result.ok ? result.quote : null
    }

    const estimate = priceFor('delivery')

    return {
      lines: detailed,
      count: detailed.reduce((s, l) => s + l.qty, 0),
      /* estimate assumes courier delivery — the checkout page re-prices once a
         fulfilment method is picked */
      itemsCents: estimate?.itemsCents ?? 0,
      deliveryCents: estimate?.deliveryCents ?? 0,
      totalCents: estimate?.totalCents ?? 0,
      priceFor,
      open,
      setOpen,
      add: (id, opts = {}) => {
        dispatch({ type: 'add', id, ...opts })
        setOpen(true)
      },
      addMany: (items) => {
        items.forEach((i) => dispatch({ type: 'add', ...i }))
        setOpen(true)
      },
      setQty: (key, qty) => dispatch({ type: 'setQty', key, qty }),
      remove: (key) => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [lines, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}

export { FREE_DELIVERY_AT } from './pricing'
