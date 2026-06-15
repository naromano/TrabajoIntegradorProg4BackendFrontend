import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WebSocketState {
  connected: boolean
  subscribedOrders: Set<number>
  setConnected: (connected: boolean) => void
  addSubscription: (orderId: number) => void
  removeSubscription: (orderId: number) => void
  clearSubscriptions: () => void
}

export const useWebSocketStore = create<WebSocketState>()(
  persist(
    (set, get) => ({
      connected: false,
      subscribedOrders: new Set<number>(),

      setConnected: (connected) => set({ connected }),

      addSubscription: (orderId) => {
        const current = new Set(get().subscribedOrders)
        current.add(orderId)
        set({ subscribedOrders: current })
      },

      removeSubscription: (orderId) => {
        const current = new Set(get().subscribedOrders)
        current.delete(orderId)
        set({ subscribedOrders: current })
      },

      clearSubscriptions: () => set({ subscribedOrders: new Set() }),
    }),
    {
      name: 'ws-store',
      partialize: (state) => ({
        subscribedOrders: Array.from(state.subscribedOrders),
      }),
      merge: (persisted, current) => ({
        ...current,
        subscribedOrders: new Set(
          Array.isArray((persisted as { subscribedOrders?: number[] })?.subscribedOrders)
            ? (persisted as { subscribedOrders: number[] }).subscribedOrders
            : []
        ),
      }),
    }
  )
)
