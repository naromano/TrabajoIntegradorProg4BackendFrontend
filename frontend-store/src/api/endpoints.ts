import api from './axios'
import type { Producto, Categoria, Pedido, Direccion } from '../types'

interface ListResponse<T> {
  data: T[]
}

export const getProductos = (params?: Record<string, unknown>) =>
  api.get<ListResponse<Producto>>('/productos/', { params })

export const getProducto = (id: number) =>
  api.get<Producto>(`/productos/${id}`)

export const getCategorias = (params?: Record<string, unknown>) =>
  api.get<ListResponse<Categoria>>('/categorias/', { params })

export const createPedido = (data: {
  usuario_id: number
  forma_pago_codigo: string
  direccion_id?: number
  items: Array<{ producto_id: number; cantidad: number }>
}) => api.post('/pedidos/', data)

export const getMisPedidos = (usuarioId?: number) =>
  api.get<ListResponse<Pedido>>('/pedidos/', { params: { usuario_id: usuarioId } })

export const getEstadoMisPedidos = (offset: number = 0) =>
  api.get<{ data: Pedido[], total: number }>('/pedidos/mi-estado', { params: { offset, limit: 12 } })

export const cancelarPedido = (id: number, motivo: string) =>
  api.patch(`/pedidos/${id}/cancelar`, { motivo })

export const validarStock = (items: Array<{ producto_id: number; cantidad: number }>) =>
  api.post<{ ok: boolean; detail: string | null }>('/pedidos/validar-stock', { items })

export const getTodosLosPedidos = () =>
  api.get<ListResponse<Pedido>>('/pedidos/')

export const getDirecciones = (usuarioId: number) =>
  api.get<ListResponse<Direccion>>(`/direcciones/usuario/${usuarioId}`)

export const createDireccion = (data: {
  usuario_id: number
  alias: string
  linea1: string
  linea2?: string
  ciudad: string
  provincia: string
  codigo_postal: string
  es_principal: boolean
}) => api.post('/direcciones/', data)

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data)

export const register = (data: {
  nombre: string
  apellido: string
  email: string
  password: string
}) => api.post('/usuarios/', data)

export const getMe = () => api.get('/auth/me')

export const crearPreferenciaPago = (pedido_id: number) =>
  api.post<{ preference_id: string; init_point: string; public_key: string }>(
    '/pagos/preferencia',
    { pedido_id }
  )