import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore, saveCartForUser } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'

export default function PagoExitoso() {
  const clearCart = useCartStore((s) => s.clearCart)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    clearCart()
    if (userId) {
      saveCartForUser(userId)
    }
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center animate-scale-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-stone-800">¡Pago exitoso!</h2>
        <p className="text-stone-500 mt-3 text-lg max-w-sm mx-auto">
          Tu pedido fue confirmado y está siendo preparado. Te avisaremos cuando esté listo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link
            to="/mis-pedidos"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver mis pedidos
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}