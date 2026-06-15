export interface User {
  id: number
  email: string
  nombre: string
  apellido: string
  roles: string[]
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio_base: number
  disponible: boolean
  imagenes_url: string[] | null
  categoria_nombre?: string
  ingredientes?: ProductoIngrediente[]
}

export interface ProductoIngrediente {
  id: number
  nombre: string
  cantidad: number
  unidad_medida: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
}

export interface CartItem {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

export interface Direccion {
  id: number
  usuario_id: number
  alias: string
  linea1: string
  linea2?: string
  ciudad: string
  provincia: string
  codigo_postal: string
  es_principal: boolean
}

export interface Pedido {
  id: number
  fecha: string
  total: number
  estado: string
  usuario_id: number
  items: PedidoItem[]
  motivo_cancelacion?: string
}

export interface PedidoItem {
  id: number
  producto_id: number
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}