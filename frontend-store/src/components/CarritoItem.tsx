import type { CartItem } from '../types'
import { useCartStore } from '../store/useCartStore'

interface CarritoItemProps {
  item: CartItem
}

export default function CarritoItem({ item }: CarritoItemProps) {
  const { updateQuantity, removeItem } = useCartStore()

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      updateQuantity(item.producto_id, value)
    }
  }

  return (
    <div className="p-5 flex items-center gap-4 hover:bg-stone-50 transition-colors">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-stone-800 truncate">{item.nombre}</h3>
        <p className="text-sm text-stone-500 mt-0.5">
          ${item.precio_unitario.toFixed(2)} por unidad
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
          className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="number"
          min="1"
          value={item.cantidad}
          onChange={handleQuantityChange}
          className="w-14 text-center py-2 border border-stone-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
          className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
      </div>

      <div className="w-28 text-right">
        <p className="font-bold text-lg text-stone-800">
          ${item.subtotal.toFixed(2)}
        </p>
      </div>

      <button
        onClick={() => removeItem(item.producto_id)}
        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar producto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}