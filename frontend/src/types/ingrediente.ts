export interface Ingrediente {
  id: number
  nombre: string
  descripcion?: string
  es_alergeno: boolean
  stock_cantidad: number
  costo: number
  imagen_url?: string
  unidad_medida_id?: number
  created_at?: string
  updated_at?: string
}
