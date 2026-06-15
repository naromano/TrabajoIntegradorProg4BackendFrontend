export interface ProductoIngrediente {
  ingrediente_id: number
  cantidad: number
  unidad_medida_id: number
  es_removible: boolean
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio_base: number
  disponible: boolean
  imagenes_url: string | string[]
  stock_cantidad: number
  costo_base?: number
  categoria_id?: number
  es_principal: boolean
  porcentaje_ganancia?: number
  producto_ingredientes?: ProductoIngrediente[]
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface CostoDesgloseItem {
  ingrediente_id: number
  ingrediente_nombre: string
  cantidad_receta: number
  unidad_receta: string
  costo_unitario: number
  unidad_base: string
  costo_total: number
}

export interface CostoCalculado {
  producto_id: number
  costo_ingredientes: number
  porcentaje_ganancia: number | null
  precio_sugerido: number | null
  desglose: CostoDesgloseItem[]
}
