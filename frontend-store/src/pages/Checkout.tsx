import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore, saveCartForUser } from '../store/useCartStore'
import { createPedido, getDirecciones, createDireccion, crearPreferenciaPago } from '../api/endpoints'
import type { Direccion } from '../types'

export default function Checkout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, loading } = useAuthStore()
  const { items, total, clearCart } = useCartStore()
  const [direccionId, setDireccionId] = useState<number | ''>('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formaPago, setFormaPago] = useState('EFECTIVO')

  const [alias, setAlias] = useState('')
  const [linea1, setLinea1] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [retiroLocal, setRetiroLocal] = useState(false)

  const { data: direccionesRes, isLoading: loadingDirecciones } = useQuery({
    queryKey: ['direcciones', user?.id],
    queryFn: () => getDirecciones(user!.id),
    enabled: !!user?.id,
  })

  const direcciones: Direccion[] = direccionesRes?.data?.data ?? []

  const envio = retiroLocal ? 0 : (total >= 10000 ? 0 : 3500)
  const totalFinal = total + envio

  const direccionMutation = useMutation({
    mutationFn: () =>
      createDireccion({
        usuario_id: user!.id,
        alias,
        linea1,
        ciudad,
        provincia,
        codigo_postal: codigoPostal,
        es_principal: direcciones.length === 0,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['direcciones', user?.id] })
      setDireccionId(res.data.id)
      setShowForm(false)
      setAlias('')
      setLinea1('')
      setCiudad('')
      setProvincia('')
      setCodigoPostal('')
    },
    onError: () => {
      setError('Error al guardar la dirección.')
    },
  })

  const pedidoMutation = useMutation({
    mutationFn: () =>
      createPedido({
        usuario_id: user!.id,
        forma_pago_codigo: formaPago,
        ...(retiroLocal ? {} : { direccion_id: Number(direccionId) }),
        items: items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
      }),
    onSuccess: async (res) => {
      if (formaPago === 'MERCADOPAGO') {
        try {
          const { data } = await crearPreferenciaPago(res.data.id)
          window.location.href = data.init_point
        } catch {
          setError('Error al conectar con MercadoPago. Intente nuevamente.')
        }
        return
      }

      clearCart()
      if (user?.id) saveCartForUser(user.id)
      queryClient.invalidateQueries({ queryKey: ['mis-pedidos'] })
      setTimeout(() => {
        navigate(`/?pedido_creado=${res.data.id}`)
      }, 0)
    },
    onError: (error: { response?: { status?: number; data?: { detail?: string } } }) => {
      if (error.response?.status === 409) {
        setError(error.response?.data?.detail || 'Stock insuficiente')
      } else {
        setError('Error al crear el pedido. Intente nuevamente.')
      }
    },
  })

  const handleSubmitPedido = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!retiroLocal && !direccionId) return
    pedidoMutation.mutate()
  }

  const handleSubmitDireccion = () => {
    setError('')
    direccionMutation.mutate()
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (items.length === 0) {
      navigate('/carrito')
    }
  }, [items, navigate])

  if (loading || loadingDirecciones) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="text-stone-500 mt-4">Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Finalizar pedido</h1>
        <p className="text-stone-500 mt-2">Completá los datos para confirmar tu compra</p>
      </div>

      <form onSubmit={handleSubmitPedido} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">
                  1
                </span>
                {retiroLocal ? 'Retiro en el local' : 'Dirección de entrega'}
              </h2>
              {!retiroLocal && (
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {showForm ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nueva dirección
                    </>
                  )}
                </button>
              )}
            </div>

            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all mb-4 ${retiroLocal ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20' : 'border-stone-200 bg-stone-50 hover:border-orange-300'}`}>
              <input
                type="checkbox"
                checked={retiroLocal}
                onChange={(e) => {
                  setRetiroLocal(e.target.checked)
                  if (e.target.checked) {
                    setDireccionId('')
                  }
                }}
                className="accent-orange-600 w-5 h-5"
              />
              <div>
                <span className="font-semibold text-stone-800">🏪 Retirar en el local</span>
                <span className="text-sm text-stone-500 ml-2">Sin costo de envío</span>
              </div>
            </label>

            {!retiroLocal && showForm && (
              <div className="mb-6 p-5 bg-amber-50 rounded-xl border border-amber-200 space-y-4">
                <h3 className="font-semibold text-stone-700">Nueva dirección</h3>
                <input
                  type="text"
                  placeholder="Alias (ej: Casa, Trabajo)"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Dirección (ej: Av. Siempre Viva 123)"
                  value={linea1}
                  onChange={(e) => setLinea1(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Código postal"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleSubmitDireccion}
                  disabled={direccionMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-stone-300 disabled:to-stone-300 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  {direccionMutation.isPending ? 'Guardando...' : 'Guardar dirección'}
                </button>
              </div>
            )}

            {!retiroLocal && (direcciones.length > 0 ? (
              <select
                value={direccionId}
                onChange={(e) => setDireccionId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                <option value="">Seleccionar dirección...</option>
                {direcciones.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {dir.alias} — {dir.linea1}, {dir.ciudad}
                    {dir.es_principal ? ' (Principal)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              !showForm && (
                <div className="text-center py-8 bg-stone-50 rounded-xl">
                  <p className="text-stone-500">No tenés direcciones guardadas.</p>
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-orange-600 font-medium hover:underline"
                  >
                    Agregá una nueva
                  </button>
                </div>
              )
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">
                2
              </span>
              Forma de pago
            </h2>
            <div className="space-y-3">
              {[
                { codigo: 'EFECTIVO', label: 'Efectivo', sublabel: 'Retiro en local', icon: '💵' },
                { codigo: 'MERCADOPAGO', label: 'MercadoPago', sublabel: 'Tarjeta o transferencia', icon: '💳' },
                { codigo: 'TRANSFERENCIA', label: 'Transferencia bancaria', sublabel: 'Alias CBU/CVU', icon: '🏦' },
              ].map((opcion) => (
                <label
                  key={opcion.codigo}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    formaPago === opcion.codigo
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20'
                      : 'border-stone-200 hover:border-orange-300 bg-stone-50'
                  }`}
                >
                  <span className="text-2xl">{opcion.icon}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-stone-800">{opcion.label}</span>
                    <span className="text-sm text-stone-500 ml-2">{opcion.sublabel}</span>
                  </div>
                  <input
                    type="radio"
                    name="formaPago"
                    value={opcion.codigo}
                    checked={formaPago === opcion.codigo}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="accent-orange-600 w-5 h-5"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">
                3
              </span>
              Productos
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.producto_id} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                  <div>
                    <span className="font-medium text-stone-700">{item.nombre}</span>
                    <span className="text-sm text-stone-400 ml-2">x{item.cantidad}</span>
                  </div>
                  <span className="font-semibold text-stone-800">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-stone-800 mb-5">Resumen</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium">${total.toFixed(2)}</span>
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
              <div className="pt-4 border-t border-stone-100">
                <div className="flex justify-between">
                  <span className="font-bold text-stone-800">Total</span>
                  <span className="text-2xl font-bold price">${totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-stone-50 rounded-xl space-y-2">
              {retiroLocal && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-stone-600">Modo:</span>
                  <span className="text-orange-600 font-medium">🏪 Retiro en el local</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-stone-600">Forma de pago:</span>
                <span className="text-stone-500">
                  {formaPago === 'EFECTIVO' && '💵 Efectivo'}
                  {formaPago === 'MERCADOPAGO' && '💳 MercadoPago'}
                  {formaPago === 'TRANSFERENCIA' && '🏦 Transferencia'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={pedidoMutation.isPending || (!retiroLocal && !direccionId)}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-stone-300 disabled:to-stone-300 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pedidoMutation.isPending ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {formaPago === 'MERCADOPAGO' ? 'Redirigiendo...' : 'Procesando...'}
                </>
              ) : (
                <>
                  Confirmar pedido
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}