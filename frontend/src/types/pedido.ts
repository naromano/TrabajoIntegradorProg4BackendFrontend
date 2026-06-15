export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'EN_PREP' | 'ENTREGADO' | 'CANCELADO'
export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADOPAGO'

export interface PedidoDetalle {
  nombre_snapshot: string
  cantidad: number
  precio_snapshot: number
  subtotal_snap: number
  personalizacion?: number[] | null
  created_at?: string
}

export interface PedidoHistorialItem {
  id?: number
  pedido_id?: number
  estado_desde_codigo: string | null
  estado_hacia_codigo: string
  usuario_id: number | string | null
  motivo: string | null
  created_at: string
}

export interface Pedido {
  id: number
  usuario_id: number
  usuario_nombre?: string | null
  direccion_id?: number | null
  direccion_texto?: string | null
  estado_codigo: EstadoPedido
  forma_pago_codigo: FormaPago
  subtotal: number
  descuento?: number
  costo_envio: number
  total: number
  notas?: string | null
  created_at: string
  updated_at?: string
  deleted_at?: string | null
  detalles?: PedidoDetalle[]
  historial?: PedidoHistorialItem[]
}

export interface PedidoListItem {
  id: number
  usuario_nombre: string | null
  usuario_id?: number
  estado_codigo: EstadoPedido
  forma_pago_codigo: FormaPago
  total: number
  created_at: string
}

export interface PedidoItem {
  producto_id: number
  cantidad: number
  personalizacion?: number[] | null
}

export interface PedidoCreateForm {
  usuario_id: number
  direccion_id?: number | null
  forma_pago_codigo: FormaPago
  notas?: string | null
  items: PedidoItem[]
}
