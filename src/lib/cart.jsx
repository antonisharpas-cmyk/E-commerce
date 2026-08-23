import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { bySlug } from './catalog'

export const FREE_DELIVERY_AT = 50
export const DELIVERY_FEE = 4.5

const CartContext = createContext(null)

const lineKey = (id, size, flavour) => [id, size || '-', flavour || '-'].join('::')

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { id, size, flavour, qty = 1 } = action
      const key = lineKey(id, size, flavour)
      const existing = state.find((l) => l.key === key)
      if (existing) return state.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 20) } : l))
      return [...state, { key, id, size, flavour, qty }]
    }
    case 'setQty':
      return state
        .map((l) => (l.key === action.key ? { ...l, qty: Math.max(0, Math.min(action.qty, 20)) } : l))
        .filter((l) => l.qty > 0)
    case 'remove':
      return state.filter((l) => l.key !== action.key)
    case 'clear':
      return []
    default:
      return state
  }
}

const readStored = () => {
  try {
    const raw = localStorage.getItem('fm-cart')
    return raw ? JSON.parse(raw) : []
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
      /* ignore */
    }
  }, [lines])

  // lock scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const value = useMemo(() => {
    const detailed = lines
      .map((l) => ({ ...l, product: bySlug(l.id) }))
      .filter((l) => l.product)
    const subtotal = detailed.reduce((s, l) => s + l.product.price * l.qty, 0)
    const count = detailed.reduce((s, l) => s + l.qty, 0)
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE
    return {
      lines: detailed,
      count,
      subtotal,
      delivery,
      total: subtotal + delivery,
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
