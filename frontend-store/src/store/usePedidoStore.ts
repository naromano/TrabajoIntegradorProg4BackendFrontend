import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Pedido } from '../types'

interface PedidoState {
  pedidos: Record<number, Pedido>
  setPedido: (pedido: Pedido) => void
  updateEstado: (pedidoId: number, estado: string) => void
  removePedido: (pedidoId: number) => void
  clearPedidos: () => void
}

export const usePedidoStore = create<PedidoState>()(
  persist(
    (set, get) => ({
      pedidos: {},

      setPedido: (pedido) => {
        set({ pedidos: { ...get().pedidos, [pedido.id]: pedido } })
      },

      updateEstado: (pedidoId, estado) => {
        const current = get().pedidos[pedidoId]
        if (!current) return
        set({
          pedidos: {
            ...get().pedidos,
            [pedidoId]: { ...current, estado },
          },
        })
      },

      removePedido: (pedidoId) => {
        const { [pedidoId]: _, ...rest } = get().pedidos
        set({ pedidos: rest })
      },

      clearPedidos: () => set({ pedidos: {} }),
    }),
    {
      name: 'pedido-store',
    }
  )
)
