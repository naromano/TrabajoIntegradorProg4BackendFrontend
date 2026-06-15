import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'
import type { User } from '../types'
import { saveCartForUser, loadCartForUser, useCartStore } from './useCartStore'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (nombre: string, apellido: string, email: string, password: string) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email: string, password: string) => {
    const loginResponse = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', loginResponse.data.access_token)
    const meResponse = await api.get('/auth/me')
    const userData = meResponse.data

    set({
      user: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        roles: userData.roles,
      },
      isAuthenticated: true,
      loading: false,
    })
    loadCartForUser(userData.id)
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
    } finally {
      localStorage.removeItem('access_token')
      set({ user: null, isAuthenticated: false })
      useCartStore.getState().clearCart()
    }
  },

  register: async (nombre: string, apellido: string, email: string, password: string) => {
    await api.post('/usuarios/', { nombre, apellido, email, password })
    await get().login(email, password)
  },

      checkAuth: async () => {
        try {
          const response = await api.get('/auth/me')
          const userData = response.data

          set({
            user: {
              id: userData.id,
              email: userData.email,
              nombre: userData.nombre,
              apellido: userData.apellido,
              roles: userData.roles,
            },
            isAuthenticated: true,
            loading: false,
          })
        } catch {
          try {
            const refreshResponse = await api.post('/auth/refresh')
            localStorage.setItem('access_token', refreshResponse.data.access_token)
            const response = await api.get('/auth/me')
            const userData = response.data

            set({
              user: {
                id: userData.id,
                email: userData.email,
                nombre: userData.nombre,
                apellido: userData.apellido,
                roles: userData.roles,
              },
              isAuthenticated: true,
              loading: false,
            })
          } catch {
            set({ user: null, isAuthenticated: false, loading: false })
          }
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

useCartStore.subscribe(() => {
  const userId = useAuthStore.getState().user?.id
  if (userId) {
    saveCartForUser(userId)
  }
})