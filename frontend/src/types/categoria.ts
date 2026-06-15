export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  parent_id?: number | null
  imagen_url?: string
  created_at?: string
  updated_at?: string
}

export interface CategoriaNodo extends Categoria {
  children: CategoriaNodo[]
  depth?: number
}
