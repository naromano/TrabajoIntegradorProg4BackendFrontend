export interface ResumenEstadisticas {
  ventas_hoy: number
  ticket_promedio: number
  pedidos_activos: number
  mes_actual: number
}

export interface EstadoCantidad {
  estado_codigo: string
  cantidad: number
}

export interface ProductoTop {
  nombre: string
  ingresos: number
}
