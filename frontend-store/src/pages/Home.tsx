import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import ProductoCard from '../components/ProductoCard'
import { getProductos, getCategorias } from '../api/endpoints'
import { useCartStore } from '../store/useCartStore'
import type { Producto, Categoria } from '../types'

export default function Home() {
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  const [page, setPage] = useState(0)
  const limit = 12
  const [pedidoCreadoMsg, setPedidoCreadoMsg] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const pedidoCreadoParam = searchParams.get('pedido_creado')
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    if (pedidoCreadoParam) {
      clearCart()
      setPedidoCreadoMsg(`Pedido #${pedidoCreadoParam} creado con exito`)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('pedido_creado')
      setSearchParams(newParams, { replace: true })
    }
  }, [pedidoCreadoParam])

  useEffect(() => {
    if (!pedidoCreadoMsg) return
    const timer = setTimeout(() => setPedidoCreadoMsg(null), 5000)
    return () => clearTimeout(timer)
  }, [pedidoCreadoMsg])

  const {
    data: productosRes,
    isLoading: loadingProductos,
  } = useQuery({
    queryKey: ['productos', search, categoriaId, page],
    queryFn: () =>
      getProductos({
        offset: page * limit,
        limit,
        ...(search ? { nombre: search } : {}),
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
      }),
  })

  const { data: categoriasRes } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => getCategorias(),
  })

  const productos: Producto[] = productosRes?.data?.data ?? []
  const categorias: Categoria[] = categoriasRes?.data?.data ?? []

  return (
    <div className="min-h-screen">
      {pedidoCreadoMsg && (
        <div className="bg-green-600 text-white text-center py-3 px-4 font-medium text-sm animate-pulse">
          {pedidoCreadoMsg}
        </div>
      )}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Delivery de calidad
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Las mejores{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                comidas
              </span>{' '}
              de la ciudad
            </h1>
            <p className="mt-6 text-lg text-stone-300 max-w-lg">
              Ingredientes frescos, recetas artesanales y el sabor que te va a encantar.
              Hacé tu pedido y disfrutalo en tu casa.
            </p>

            <div className="flex gap-8 mt-10">
              <div>
                <p className="text-3xl font-bold text-white">4.9+</p>
                <p className="text-stone-400 text-sm">Puntuación</p>
              </div>
              <div className="w-px bg-stone-700"></div>
              <div>
                <p className="text-3xl font-bold text-white">30min</p>
                <p className="text-stone-400 text-sm">Tiempo promedio</p>
              </div>
              <div className="w-px bg-stone-700"></div>
              <div>
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-stone-400 text-sm">Pedidos mensuales</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
            />
          </div>
          <select
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value ? Number(e.target.value) : '')
              setPage(0)
            }}
            className="px-5 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm font-medium text-stone-700 cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {loadingProductos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="h-52 skeleton"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 skeleton rounded"></div>
                  <div className="h-4 w-1/2 skeleton rounded"></div>
                  <div className="h-6 w-1/3 skeleton rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : productos.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-stone-500">
                Mostrando <span className="font-semibold text-stone-700">{productos.length}</span> productos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productos.map((producto, index) => (
                <div key={producto.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <ProductoCard producto={producto} />
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-5 py-2.5 bg-white border border-stone-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-stone-600 hover:text-orange-600 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              <span className="px-4 py-2 bg-stone-100 rounded-xl text-stone-600 font-medium">
                Página <span className="text-orange-600 font-bold">{page + 1}</span>
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={productos.length < limit}
                className="px-5 py-2.5 bg-white border border-stone-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-stone-600 hover:text-orange-600 flex items-center gap-2 shadow-sm"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-stone-700">No encontramos productos</h3>
            <p className="text-stone-500 mt-2">Probá cambiando los filtros o buscando otra cosa</p>
          </div>
        )}
      </div>
    </div>
  )
}