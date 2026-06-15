import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProducto } from '../api/endpoints'
import { useCartStore } from '../store/useCartStore'
import type { Producto } from '../types'

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>()
  const [cantidad, setCantidad] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => getProducto(Number(id)),
    enabled: !!id,
  })

  const producto: Producto | null = res?.data ?? null

  const handleAddToCart = () => {
    if (!producto) return
    addItem(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_base,
      },
      cantidad
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="text-stone-500 mt-4">Cargando producto...</p>
      </div>
    )
  }

  if (isError || !producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-bold text-stone-700">Producto no encontrado</h3>
        <p className="text-stone-500 mt-2">Este producto no existe o fue eliminado</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-6 text-orange-600 hover:text-orange-700 font-medium"
        >
          ← Volver al catálogo
        </Link>
      </div>
    )
  }

  const sinStock = !producto.disponible

  const getImageSrc = () => {
    if (!producto.imagenes_url) return null
    if (Array.isArray(producto.imagenes_url) && producto.imagenes_url.length > 0) return producto.imagenes_url[0]
    return null
  }

  const imagenSrc = getImageSrc()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 font-medium mb-8 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center overflow-hidden shadow-lg">
            {imagenSrc ? (
              <img
                src={imagenSrc}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl opacity-40">🍕</span>
            )}
          </div>

          {sinStock && (
            <div className="absolute inset-0 bg-stone-900/50 rounded-3xl flex items-center justify-center">
              <span className="badge badge-error text-lg px-6 py-2">Sin stock</span>
            </div>
          )}

          {producto.categoria_nombre && (
            <div className="absolute top-4 left-4">
              <span className="badge badge-primary bg-white/90 backdrop-blur-sm shadow-md">
                {producto.categoria_nombre}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-800 leading-tight">
            {producto.nombre}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-bold price">
              ${producto.precio_base.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </span>
            {producto.precio_base < 100 && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Envío gratis disponible
              </span>
            )}
          </div>

          {producto.descripcion && (
            <p className="mt-6 text-lg text-stone-600 leading-relaxed">
              {producto.descripcion}
            </p>
          )}

          {producto.ingredientes && producto.ingredientes.length > 0 && (
            <div className="mt-8 p-5 bg-stone-50 rounded-2xl border border-stone-200">
              <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ingredientes
              </h3>
              <ul className="space-y-2">
                {producto.ingredientes.map((ing) => (
                  <li key={ing.id} className="flex items-center gap-2 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    <span className="font-medium">{ing.nombre}</span>
                    <span className="text-stone-400">— {ing.cantidad} {ing.unidad_medida}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!sinStock && (
            <div className="mt-auto pt-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-12 text-center font-bold text-xl text-stone-800">{cantidad}</span>
                  <button
                    onClick={() => setCantidad((c) => c + 1)}
                    className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Agregar al carrito
                </button>
              </div>
            </div>
          )}

          {sinStock && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-center">
              Este producto no está disponible actualmente
            </div>
          )}
        </div>
      </div>
    </div>
  )
}