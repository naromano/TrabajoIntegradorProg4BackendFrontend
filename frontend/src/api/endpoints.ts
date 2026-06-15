import { AxiosResponse } from 'axios'
import api from './axios'
import type { ListResponse } from '../types/api'
import type { User } from '../types/user'
import type { Producto, CostoCalculado } from '../types/producto'
import type { Pedido, PedidoListItem } from '../types/pedido'
import type { Categoria, CategoriaNodo } from '../types/categoria'
import type { Ingrediente } from '../types/ingrediente'
import type { UnidadMedida } from '../types/unidad'
import type { ResumenEstadisticas, EstadoCantidad, ProductoTop } from '../types/estadisticas'

type Params = Record<string, unknown>

export const login = (data: Params): Promise<AxiosResponse<{ access_token: string }>> =>
  api.post('/auth/login', data)

export const refreshToken = (data: Params): Promise<AxiosResponse<{ access_token: string }>> =>
  api.post('/auth/refresh', data)

export const logout = (data: Params): Promise<AxiosResponse<void>> =>
  api.post('/auth/logout', data)

export const getUsuarios = (params?: Params): Promise<AxiosResponse<ListResponse<User>>> =>
  api.get('/usuarios/', { params })

export const getUsuarioById = (id: number): Promise<AxiosResponse<User>> =>
  api.get(`/usuarios/${id}`)

export const createUsuario = (data: Params): Promise<AxiosResponse<User>> =>
  api.post('/usuarios/', data)

export const updateUsuario = (id: number, data: Params): Promise<AxiosResponse<User>> =>
  api.patch(`/usuarios/${id}`, data)

export const deleteUsuario = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/usuarios/${id}`)

export const getProductos = (params?: Params): Promise<AxiosResponse<ListResponse<Producto>>> =>
  api.get('/productos/', { params })

export const getProductoById = (id: number): Promise<AxiosResponse<Producto>> =>
  api.get(`/productos/${id}`)

export const createProducto = (data: Params): Promise<AxiosResponse<Producto>> =>
  api.post('/productos/', data)

export const updateProducto = (id: number, data: Params): Promise<AxiosResponse<Producto>> =>
  api.patch(`/productos/${id}`, data)

export const deleteProducto = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/productos/${id}/desactivar`)

export const getUsuarioRoles = (id: number): Promise<AxiosResponse<ListResponse<{ usuario_id: number; rol_codigo: string }>>> =>
  api.get(`/usuarios/${id}/roles`)

export const assignRole = (data: { usuario_id: number; rol_codigo: string }): Promise<AxiosResponse<Record<string, unknown>>> =>
  api.post('/usuarios/roles', data)

export const removeRole = (usuario_id: number, rol_codigo: string): Promise<AxiosResponse<void>> =>
  api.delete(`/usuarios/${usuario_id}/roles/${rol_codigo}`)

export const reactivateProducto = (id: number): Promise<AxiosResponse<Producto>> =>
  api.patch(`/productos/${id}/reactivar`)

export const getArbolCategorias = (): Promise<AxiosResponse<CategoriaNodo[]>> =>
  api.get('/categorias/arbol')

export const getUnidadesMedida = (params?: Params): Promise<AxiosResponse<UnidadMedida[]>> =>
  api.get('/unidad-medida/', { params })

export const getCategorias = (params?: Params): Promise<AxiosResponse<ListResponse<Categoria>>> =>
  api.get('/categorias/', { params })

export const getCategoriaById = (id: number): Promise<AxiosResponse<Categoria>> =>
  api.get(`/categorias/${id}`)

export const createCategoria = (data: Params): Promise<AxiosResponse<Categoria>> =>
  api.post('/categorias/', data)

export const updateCategoria = (id: number, data: Params): Promise<AxiosResponse<Categoria>> =>
  api.patch(`/categorias/${id}`, data)

export const deleteCategoria = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/categorias/${id}`)

export const getIngredientes = (params?: Params): Promise<AxiosResponse<ListResponse<Ingrediente>>> =>
  api.get('/ingredientes/', { params })

export const getIngredienteById = (id: number): Promise<AxiosResponse<Ingrediente>> =>
  api.get(`/ingredientes/${id}`)

export const createIngrediente = (data: Params): Promise<AxiosResponse<Ingrediente>> =>
  api.post('/ingredientes/', data)

export const updateIngrediente = (id: number, data: Params): Promise<AxiosResponse<Ingrediente>> =>
  api.patch(`/ingredientes/${id}`, data)

export const deleteIngrediente = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/ingredientes/${id}`)

export const getPedidos = (params?: Params): Promise<AxiosResponse<ListResponse<PedidoListItem>>> =>
  api.get('/pedidos/', { params })

export const getPedidoById = (id: number): Promise<AxiosResponse<Pedido>> =>
  api.get(`/pedidos/${id}`)

export const createPedido = (data: Params): Promise<AxiosResponse<Pedido>> =>
  api.post('/pedidos/', data)

export const avanzarEstadoPedido = (id: number, data: Params): Promise<AxiosResponse<Pedido>> =>
  api.patch(`/pedidos/${id}/estado`, data)

export const deletePedido = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/pedidos/${id}`)

export const getDirecciones = (params?: Params): Promise<AxiosResponse<ListResponse<Record<string, unknown>>>> =>
  api.get('/direcciones/', { params })

export const getDireccionById = (id: number): Promise<AxiosResponse<Record<string, unknown>>> =>
  api.get(`/direcciones/${id}`)

export const createDireccion = (data: Params): Promise<AxiosResponse<Record<string, unknown>>> =>
  api.post('/direcciones/', data)

export const updateDireccion = (
  usuario_id: number,
  direccion_id: number,
  data: Params
): Promise<AxiosResponse<Record<string, unknown>>> =>
  api.patch(`/direcciones/${usuario_id}/${direccion_id}`, data)

export const deleteDireccion = (
  usuario_id: number,
  direccion_id: number
): Promise<AxiosResponse<void>> =>
  api.delete(`/direcciones/${usuario_id}/${direccion_id}`)

export const getCostoProducto = (id: number): Promise<AxiosResponse<CostoCalculado>> =>
  api.get(`/productos/${id}/costo`)

export const uploadImage = (file: File, folder: string = "productos"): Promise<AxiosResponse<{ url: string; public_id: string }>> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)
  return api.post("/uploads/", formData)
}

export const deleteImage = (publicId: string): Promise<AxiosResponse<void>> =>
  api.delete(`/uploads/${publicId}`)

export const getEstadisticasResumen = (): Promise<AxiosResponse<ResumenEstadisticas>> =>
  api.get("/estadisticas/resumen")

export const getEstadisticasVentas = (params?: Params): Promise<AxiosResponse<ListResponse<Record<string, unknown>>>> =>
  api.get("/estadisticas/ventas", { params })

export const getEstadisticasProductosTop = (params?: Params): Promise<AxiosResponse<ListResponse<ProductoTop>>> =>
  api.get("/estadisticas/productos-top", { params })

export const getEstadisticasPedidosPorEstado = (): Promise<AxiosResponse<ListResponse<EstadoCantidad>>> =>
  api.get("/estadisticas/pedidos-por-estado")

export const getEstadisticasIngresos = (params?: Params): Promise<AxiosResponse<ListResponse<Record<string, unknown>>>> =>
  api.get("/estadisticas/ingresos", { params })
