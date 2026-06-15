export interface WSMessage {
  event: 'WS_CONNECTED' | 'estado_cambiado' | 'pedido_cancelado' | 'SUBSCRIBED' | 'ERROR'
  data: WSMessageData | null
}

export interface WSMessageData {
  pedido_id?: number
  estado_anterior?: string | null
  estado_nuevo?: string
  motivo?: string
  usuario_id?: number
  timestamp?: string
  order_id?: number
  detail?: string
}
