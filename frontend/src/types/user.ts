export type Role = 'ADMIN' | 'STOCK' | 'PEDIDOS'

export interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  celular?: string
  activo: boolean
  rol: Role
  roles?: string[]
  created_at?: string
}
