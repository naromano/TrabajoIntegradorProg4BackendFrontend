import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useCartStore } from '../store/useCartStore'

export default function Layout() {
  const lastAddedProduct = useCartStore((state) => state.lastAddedProduct)
  const clearLastAdded = useCartStore((state) => state.clearLastAdded)

  useEffect(() => {
    if (lastAddedProduct) {
      const timer = setTimeout(() => {
        clearLastAdded()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastAddedProduct, clearLastAdded])

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />

      {lastAddedProduct && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/30">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">"{lastAddedProduct}" agregado al carrito</span>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-semibold text-stone-200">FoodStore</span>
            </div>
            <p className="text-sm">
              © 2026 FoodStore. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contacto@foodstore.com
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}