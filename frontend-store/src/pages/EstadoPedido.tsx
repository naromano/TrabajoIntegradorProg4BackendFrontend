import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { getEstadoMisPedidos, cancelarPedido } from '../api/endpoints'
import { useWebSocket } from '../hooks/useWebSocket'
import type { Pedido } from '../types'

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

const PAGE_SIZE = 12

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5
  let start = Math.max(1, page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-orange-50 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-600 font-medium transition-all flex items-center justify-center"
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-orange-50 hover:border-orange-300 text-sm font-medium transition-all"
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-stone-400">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
            p === page
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
              : 'bg-white border border-stone-200 hover:bg-orange-50 hover:border-orange-300 text-stone-600'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-stone-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-orange-50 hover:border-orange-300 text-sm font-medium transition-all"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-orange-50 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-600 font-medium transition-all flex items-center justify-center"
      >
        ›
      </button>
    </div>
  )
}

export default function EstadoPedido() {
  const navigate = useNavigate()
  const { isAuthenticated, loading, user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [cancelPedidoId, setCancelPedidoId] = useState<number | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  const offset = (page - 1) * PAGE_SIZE

  const { data, isLoading, isError } = useQuery({
    queryKey: ['estado-pedidos', page],
    queryFn: () => getEstadoMisPedidos(offset),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      cancelarPedido(id, motivo),
    onSuccess: () => {
      setCancelPedidoId(null)
      setCancelMotivo('')
      queryClient.invalidateQueries({ queryKey: ['estado-pedidos'] })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      alert(err.response?.data?.detail || 'Error al cancelar el pedido')
    },
  })

  const handleWsMessage = useCallback((msg: { event: string; data?: { pedido_id?: number; estado_anterior?: string | null; estado_nuevo?: string; motivo?: string } }) => {
    if (msg.event === "WS_CONNECTED") {
      queryClient.invalidateQueries({ queryKey: ['estado-pedidos'] })
      return
    }
    const d = msg.data
    if (!d) return
    if (msg.event === "estado_cambiado") {
      if (d.estado_anterior === null) {
        queryClient.invalidateQueries({ queryKey: ['estado-pedidos'] })
      } else {
        queryClient.setQueryData(['estado-pedidos', page], (old: unknown) => {
          if (!old || !Array.isArray((old as { data?: { data?: Pedido[] } })?.data?.data)) return old
          return {
            ...old,
            data: {
              ...(old as { data: { data: Pedido[]; total: number } }).data,
              data: (old as { data: { data: Pedido[] } }).data.data.map(p =>
                p.id === d.pedido_id ? { ...p, estado: d.estado_nuevo!, motivo_cancelacion: d.motivo || p.motivo_cancelacion } : p
              )
            }
          }
        })
      }
      return
    }
    if (msg.event === "pedido_cancelado") {
      queryClient.setQueryData(['estado-pedidos', page], (old: unknown) => {
        if (!old || !Array.isArray((old as { data?: { data?: Pedido[] } })?.data?.data)) return old
        return {
          ...old,
          data: {
            ...(old as { data: { data: Pedido[]; total: number } }).data,
            data: (old as { data: { data: Pedido[] } }).data.data.map(p =>
              p.id === d.pedido_id ? { ...p, estado: d.estado_nuevo!, motivo_cancelacion: d.motivo || p.motivo_cancelacion } : p
            )
          }
        }
      })
      return
    }
  }, [queryClient, page])

  useWebSocket({ onMessage: handleWsMessage, enabled: isAuthenticated })

  const pedidos: Pedido[] = data?.data?.data ?? []
  const total = data?.data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="text-stone-500 mt-4">Cargando...</p>
      </div>
    )
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </span>
          Estado de Mis Pedidos
        </h1>
        <p className="text-stone-500 mt-2">Seguimiento en tiempo real de tus pedidos</p>
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
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-xl font-bold text-stone-700">No tenés pedidos todavía</h3>
          <p className="text-stone-500 mt-2">Cuando hagas tu primer pedido, podrás seguirlo desde acá</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pedidos.map((pedido: Pedido) => (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 card-hover"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg text-stone-800">
                        Pedido #{pedido.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[pedido.estado] || 'bg-stone-100 text-stone-700'}`}>
                        {ESTADO_LABELS[pedido.estado] || pedido.estado}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500">
                      {new Date(pedido.fecha).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {' · '}
                      {new Date(pedido.fecha).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {pedido.estado === 'CANCELADO' && pedido.motivo_cancelacion && (
                      <p className="text-xs text-red-500 mt-1">
                        Motivo: {pedido.motivo_cancelacion}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold price">
                      ${pedido.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {pedido.items?.length || 0} producto{(pedido.items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {pedido.items && pedido.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-400 mb-2 uppercase font-medium tracking-wide">Productos:</p>
                    <div className="flex flex-wrap gap-2">
                      {pedido.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-stone-50 text-stone-600 text-xs px-3 py-1.5 rounded-lg border border-stone-200 font-medium"
                        >
                          {item.nombre} <span className="text-stone-400">x{item.cantidad}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(pedido.estado === 'PENDIENTE' || pedido.estado === 'CONFIRMADO') && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <button
                      onClick={() => setCancelPedidoId(pedido.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                    >
                      Cancelar pedido
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}

      {cancelPedidoId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-stone-800 mb-2">Cancelar pedido #{cancelPedidoId}</h2>
            <p className="text-sm text-stone-500 mb-4">Indicá el motivo de la cancelación:</p>
            <textarea
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              placeholder="Ej: Me arrepentí del pedido..."
              autoFocus
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setCancelPedidoId(null); setCancelMotivo('') }}
                className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (!cancelMotivo.trim()) {
                    alert('El motivo es obligatorio para cancelar')
                    return
                  }
                  cancelMutation.mutate({ id: cancelPedidoId, motivo: cancelMotivo.trim() })
                }}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:bg-stone-300 transition-colors"
              >
                {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}