import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../types'

interface CartState {
  items: CartItem[]
  total: number
  lastAddedProduct: string | null
  addItem: (producto: { id: number; nombre: string; precio_unitario: number }, cantidad: number) => void
  removeItem: (productoId: number) => void
  updateQuantity: (productoId: number, cantidad: number) => void
  clearCart: () => void
  clearLastAdded: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      lastAddedProduct: null,

      addItem: (producto, cantidad) => {
        const items = get().items
        const existingIndex = items.findIndex((item) => item.producto_id === producto.id)

        if (existingIndex >= 0) {
          const updated = [...items]
          const newCantidad = updated[existingIndex].cantidad + cantidad
          updated[existingIndex] = {
            ...updated[existingIndex],
            cantidad: newCantidad,
            subtotal: newCantidad * producto.precio_unitario,
          }
          const total = updated.reduce((sum, item) => sum + item.subtotal, 0)
          set({ items: updated, total, lastAddedProduct: producto.nombre })
        } else {
          const newItem: CartItem = {
            producto_id: producto.id,
            nombre: producto.nombre,
            precio_unitario: producto.precio_unitario,
            cantidad,
            subtotal: cantidad * producto.precio_unitario,
          }
          const updated = [...items, newItem]
          const total = updated.reduce((sum, item) => sum + item.subtotal, 0)
          set({ items: updated, total, lastAddedProduct: producto.nombre })
        }
      },

      removeItem: (productoId) => {
        const items = get().items.filter((item) => item.producto_id !== productoId)
        const total = items.reduce((sum, item) => sum + item.subtotal, 0)
        set({ items, total })
      },

      updateQuantity: (productoId, cantidad) => {
        if (cantidad < 1) {
          get().removeItem(productoId)
          return
        }
        const items = get().items.map((item) =>
          item.producto_id === productoId
            ? { ...item, cantidad, subtotal: cantidad * item.precio_unitario }
            : item
        )
        const total = items.reduce((sum, item) => sum + item.subtotal, 0)
        set({ items, total })
      },

      clearCart: () => {
        set({ items: [], total: 0 })
      },

      clearLastAdded: () => {
        set({ lastAddedProduct: null })
      },
    }),
    {
      name: 'cart-store',
    }
  )
)

const CART_PREFIX = 'cart-user-'

export function saveCartForUser(userId: number) {
  const state = useCartStore.getState()
  localStorage.setItem(
    `${CART_PREFIX}${userId}`,
    JSON.stringify({ items: state.items, total: state.total })
  )
}

export function loadCartForUser(userId: number) {
  const data = localStorage.getItem(`${CART_PREFIX}${userId}`)
  if (data) {
    try {
      const parsed = JSON.parse(data)
      useCartStore.setState({ items: parsed.items || [], total: parsed.total || 0 })
    } catch {
      useCartStore.setState({ items: [], total: 0 })
    }
  } else {
    useCartStore.setState({ items: [], total: 0 })
  }
}