export interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
  tipo: 'masa' | 'volumen' | 'unidad' | 'area'
  created_at?: string
}
