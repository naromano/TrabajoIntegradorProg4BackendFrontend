import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../api/axios'
import type { User } from '../types/user'

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  register: (nombre: string, apellido: string, email: string, password: string) => Promise<User>
  refreshToken: () => Promise<void>
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function normalizeUser(data: unknown): User {
  const d = data as Record<string, unknown>
  return {
    ...(d as unknown as User),
    rol: (d.roles as string[])?.[0] || '',
  } as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(normalizeUser(response.data))
      } catch {
        try {
          const refreshResponse = await api.post('/auth/refresh')
          localStorage.setItem('access_token', refreshResponse.data.access_token)
          const response = await api.get('/auth/me')
          setUser(normalizeUser(response.data))
        } catch {
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const loginResponse = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', loginResponse.data.access_token)
    const response = await api.get('/auth/me')
    const userData = normalizeUser(response.data)
    setUser(userData)
    return userData
  }

  const register = async (nombre: string, apellido: string, email: string, password: string): Promise<User> => {
    await api.post('/usuarios', { nombre, apellido, email, password })
    return login(email, password)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
    } finally {
      localStorage.removeItem('access_token')
      setUser(null)
    }
  }

  const refreshToken = async () => {
    await api.post('/auth/refresh')
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      refreshToken,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
