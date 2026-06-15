import { Link } from 'react-router-dom'
import type { Producto } from '../types'
import { useCartStore } from '../store/useCartStore'

interface ProductoCardProps {
  producto: Producto
}

export default function ProductoCard({ producto }: ProductoCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const sinStock = !producto.disponible

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (sinStock) return
    addItem(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_base,
      },
      1
    )
  }

  const getImageSrc = () => {
    if (!producto.imagenes_url) return null
    if (Array.isArray(producto.imagenes_url) && producto.imagenes_url.length > 0) return producto.imagenes_url[0]
    return null
  }

  const imagenSrc = getImageSrc()

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden card-hover flex flex-col h-full">
      <Link to={`/productos/${producto.id}`} className="block relative">
        <div className="h-52 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden">
          {imagenSrc ? (
            <img
              src={imagenSrc}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="text-6xl opacity-40">🍕</div>
          )}
        </div>

        {producto.categoria_nombre && (
          <div className="absolute top-3 left-3">
            <span className="badge badge-primary bg-white/90 backdrop-blur-sm shadow-sm">
              {producto.categoria_nombre}
            </span>
          </div>
        )}

        {sinStock && (
          <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
            <span className="badge badge-error text-sm px-4 py-1.5">Sin stock</span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/productos/${producto.id}`} className="block">
          <h3 className="font-bold text-lg text-stone-800 group-hover:text-orange-600 transition-colors line-clamp-1">
            {producto.nombre}
          </h3>
        </Link>

        {producto.descripcion && (
          <p className="text-sm text-stone-500 mt-1 line-clamp-2 flex-1">
            {producto.descripcion}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold price">
                ${producto.precio_base.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={sinStock}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                sinStock
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {sinStock ? 'Agotado' : 'Agregar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}