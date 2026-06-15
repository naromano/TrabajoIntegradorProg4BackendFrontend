import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SortOption = 'relevancia' | 'precio_asc' | 'precio_desc' | 'nombre_asc'

interface FiltroState {
  search: string
  categoriaId: number | null
  sortBy: SortOption
  setSearch: (search: string) => void
  setCategoriaId: (categoriaId: number | null) => void
  setSortBy: (sortBy: SortOption) => void
  clearFilters: () => void
}

export const useFiltroStore = create<FiltroState>()(
  persist(
    (set) => ({
      search: '',
      categoriaId: null,
      sortBy: 'relevancia',

      setSearch: (search) => set({ search }),
      setCategoriaId: (categoriaId) => set({ categoriaId }),
      setSortBy: (sortBy) => set({ sortBy }),
      clearFilters: () =>
        set({ search: '', categoriaId: null, sortBy: 'relevancia' }),
    }),
    {
      name: 'filtro-store',
    }
  )
)
