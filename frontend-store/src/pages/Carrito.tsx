import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'
import { validarStock } from '../api/endpoints'
import CarritoItem from '../components/CarritoItem'

export default function Carrito() {
  const { items, total } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [validando, setValidando] = useState(false)
  const [errorStock, setErrorStock] = useState('')

  const handleFinalizarPedido = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    setErrorStock('')
    setValidando(true)
    try {
      const res = await validarStock(items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad })))
      if (res.data.ok) {
        navigate('/checkout')
      } else {
        setErrorStock(res.data.detail || 'No hay stock suficiente para completar el pedido')
      }
    } catch {
      setErrorStock('Error al verificar el stock')
    } finally {
      setValidando(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <span className="text-5xl">🛒</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-800">Tu carrito está vacío</h2>
        <p className="text-stone-500 mt-3 text-lg">Agregá productos deliciousos desde nuestro catálogo</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Ver productos
        </Link>
      </div>
    )
  }

  const envio = total >= 10000 ? 0 : 3500
  const totalFinal = total + envio

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          Carrito de compras
        </h1>
        <p className="text-stone-500 mt-2">{items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h2 className="font-semibold text-stone-700">Productos seleccionados</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {items.map((item) => (
                <CarritoItem key={item.producto_id} item={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-stone-800 mb-5">Resumen del pedido</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal ({items.length} productos)</span>
                <span className="font-medium text-stone-700">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Envío</span>
                <span className="font-medium">
                  {envio === 0 ? (
                    <span className="text-emerald-600 font-semibold">Gratis</span>
                  ) : (
                    `$${envio.toFixed(2)}`
                  )}
                </span>
              </div>

              {total < 10000 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sumá ${(10000 - total).toFixed(2)} más para obtener envío gratis
                  </p>
                  <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((total / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-stone-100">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-stone-800">Total</span>
                  <span className="text-2xl font-bold price">
                    ${totalFinal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {errorStock && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorStock}
                </p>
              </div>
            )}

            <button
              onClick={handleFinalizarPedido}
              disabled={validando}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-stone-300 disabled:to-stone-300 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              {validando ? 'Verificando stock...' : 'Finalizar pedido'}
            </button>

            <Link
              to="/"
              className="block mt-4 text-center text-sm text-stone-500 hover:text-orange-600 font-medium transition-colors"
            >
              ← Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}