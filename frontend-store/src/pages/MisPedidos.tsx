import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { getEstadoMisPedidos } from '../api/endpoints'
import type { Pedido } from '../types'

const ESTADOS_VALIDOS = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_PREP',
  'EN_CAMINO',
  'ENTREGADO',
  'CANCELADO',
]

const ESTADOS_TIMELINE = ESTADOS_VALIDOS.filter((e) => e !== 'CANCELADO')

function getEstadoIndex(estado: string): number {
  return ESTADOS_VALIDOS.indexOf(estado)
}

const ESTADO_COLORS: Record<string, string> = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-700',
  'CONFIRMADO': 'bg-blue-100 text-blue-700',
  'EN_PREP': 'bg-purple-100 text-purple-700',
  'EN_CAMINO': 'bg-indigo-100 text-indigo-700',
  'ENTREGADO': 'bg-green-100 text-green-700',
  'CANCELADO': 'bg-red-100 text-red-700',
}

const ESTADO_LABELS: Record<string, string> = {
  'PENDIENTE': 'Pendiente',
  'CONFIRMADO': 'Confirmado',
  'EN_PREP': 'En Preparación',
  'EN_CAMINO': 'En Camino',
  'ENTREGADO': 'Entregado',
  'CANCELADO': 'Cancelado',
}

export default function MisPedidos() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ['mis-pedidos'],
    queryFn: getEstadoMisPedidos,
  })

  const pedidos: Pedido[] = res?.data ?? []

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="text-stone-500 mt-4">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          Mis Pedidos
        </h1>
        <p className="text-stone-500 mt-2">Historial de todos tus pedidos</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-stone-500 mt-4">Cargando pedidos...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-500">Error al cargar los pedidos</p>
        </div>
      ) : !pedidos || pedidos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-xl font-bold text-stone-700">No tenés pedidos todavía</h3>
          <p className="text-stone-500 mt-2">Cuando hagas tu primer pedido, va a aparecer acá</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 card-hover"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-stone-800">
                      Pedido #{pedido.id}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[pedido.estado] || 'bg-stone-100 text-stone-700'}`}>
                      {ESTADO_LABELS[pedido.estado] || pedido.estado}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">
                    {new Date(pedido.fecha).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold price">
                    ${pedido.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {pedidos.length > 0 && (
                <div className="mb-6 p-4 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-1">
                    {ESTADOS_TIMELINE.map((estado, idx) => {
                      const currentIdx = getEstadoIndex(pedido.estado)
                      const isActive = idx <= currentIdx
                      const isCurrent = idx === currentIdx
                      return (
                        <div key={estado} className="flex items-center flex-1">
                          <div
                            className={`w-4 h-4 rounded-full transition-all ${
                              isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-stone-300'
                            } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}
                          />
                          {idx < ESTADOS_TIMELINE.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-1 rounded ${
                                isActive && idx < currentIdx
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                                  : 'bg-stone-200'
                              }`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    {ESTADOS_TIMELINE.map((estado) => (
                      <span
                        key={estado}
                        className="text-[9px] text-stone-400 uppercase font-medium"
                      >
                        {ESTADO_LABELS[estado]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-stone-100 pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-stone-500">
                      <th className="text-left py-2 font-medium">Producto</th>
                      <th className="text-center py-2 font-medium">Cant.</th>
                      <th className="text-right py-2 font-medium">Precio</th>
                      <th className="text-right py-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.items?.map((item, idx) => (
                      <tr key={idx} className="border-t border-stone-50">
                        <td className="py-3 text-stone-700 font-medium">{item.nombre}</td>
                        <td className="py-3 text-center text-stone-500">{item.cantidad}</td>
                        <td className="py-3 text-right text-stone-500">${item.precio_unitario.toFixed(2)}</td>
                        <td className="py-3 text-right font-semibold text-stone-800">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}