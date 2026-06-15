import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPedidoById, avanzarEstadoPedido } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Pedido, EstadoPedido } from '../../types/pedido'
import { WSMessage } from '../../types/websocket'

const FSM: Record<EstadoPedido, EstadoPedido[]> = {
  'PENDIENTE': ['CONFIRMADO', 'CANCELADO'],
  'CONFIRMADO': ['EN_PREP', 'CANCELADO'],
  'EN_PREP': ['ENTREGADO', 'CANCELADO'],
  'ENTREGADO': [],
  'CANCELADO': []
}

function PedidoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showAvanzarModal, setShowAvanzarModal] = useState<boolean>(false)
  const [selectedEstado, setSelectedEstado] = useState<string>('')
  const [motivo, setMotivo] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  const isAdmin = user?.rol === 'ADMIN'
  const isPedidos = user?.rol === 'PEDIDOS'

  const fetchPedido = async () => {
    try {
      const response = await getPedidoById(Number(id))
      setPedido(response.data)
    } catch (err: unknown) {
      console.error('Error:', err)
      navigate('/pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedido()
  }, [id])

  const handleAvanzar = async () => {
    if (selectedEstado === 'CANCELADO' && !motivo) {
      alert('El motivo es obligatorio para cancelar')
      return
    }

    setSaving(true)
    try {
      await avanzarEstadoPedido(Number(id), {
        estado_hacia_codigo: selectedEstado,
        motivo: motivo || null
      })
      setShowAvanzarModal(false)
      setMotivo('')
      fetchPedido()
    } catch (err: unknown) {
      alert((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al avanzar estado')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      'PENDIENTE': 'badge-warning',
      'CONFIRMADO': 'badge-info',
      'EN_PREP': 'badge-info',
      'ENTREGADO': 'badge-success',
      'CANCELADO': 'badge-danger'
    }
    return colors[estado] || 'badge-info'
  }

  const handleWsMessage = useCallback((msg: WSMessage) => {
    const d = msg.data
    if (!d || d.pedido_id !== Number(id)) return
    if (msg.event === "estado_cambiado" || msg.event === "pedido_cancelado") {
      fetchPedido()
    }
  }, [id])

  useWebSocket({ onMessage: handleWsMessage, enabled: true })

  if (loading) return <div className="loading">Cargando...</div>

  const estadosPosibles: EstadoPedido[] = FSM[pedido?.estado_codigo as EstadoPedido] || []

  return (
    <div>
      <div className="card-header">
        <h1>Pedido #{pedido?.id}</h1>
        <Link to="/pedidos" className="btn btn-secondary">Volver</Link>
      </div>

      <div className="card">
        <h2 className="card-title">Información del Pedido</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <div>
            <strong>Cliente:</strong> {pedido?.usuario_nombre || 'No disponible'}
          </div>
          <div>
            <strong>Estado:</strong>{' '}
            <span className={`badge ${getEstadoBadge(pedido?.estado_codigo || '')}`}>
              {pedido?.estado_codigo}
            </span>
          </div>
          <div>
            <strong>Forma de Pago:</strong> {pedido?.forma_pago_codigo}
          </div>
          <div>
            <strong>Dirección:</strong> {pedido?.direccion_texto || 'Retiro en local'}
          </div>
          <div>
            <strong>Subtotal:</strong> ${pedido?.subtotal}
          </div>
          <div>
            <strong>Costo Envío:</strong> ${pedido?.costo_envio}
          </div>
          <div>
            <strong>Total:</strong> <strong>${pedido?.total}</strong>
          </div>
          <div>
            <strong>Fecha:</strong> {new Date(pedido?.created_at || '').toLocaleString()}
          </div>
        </div>

        {pedido?.notas && (
          <div style={{ marginTop: '15px' }}>
            <strong>Notas:</strong> {pedido.notas}
          </div>
        )}

        {estadosPosibles.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAvanzarModal(true)}
            >
              Avanzar Estado
            </button>
          </div>
        )}
      </div>

      {(isAdmin || isPedidos) && (
        <>
          <div className="card">
            <h2 className="card-title">Items del Pedido</h2>
            
            {pedido?.detalles?.length && pedido.detalles.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalles.map((detalle, idx) => (
                    <tr key={idx}>
                      <td>{detalle.nombre_snapshot}</td>
                      <td>{detalle.cantidad}</td>
                      <td>${detalle.precio_snapshot}</td>
                      <td>${detalle.subtotal_snap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay items</p>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Historial de Estados</h2>
            
            {pedido?.historial?.length && pedido.historial.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Hacia</th>
                    <th>Usuario</th>
                    <th>Motivo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.historial.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.estado_desde_codigo || 'Creación'}</td>
                      <td>{h.estado_hacia_codigo}</td>
                      <td>{h.usuario_id || 'Sistema'}</td>
                      <td>{h.motivo || '-'}</td>
                      <td>{new Date(h.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay historial</p>
            )}
          </div>
        </>
      )}

      {showAvanzarModal && (
        <div className="modal-overlay" onClick={() => setShowAvanzarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Avanzar Estado</h2>
              <button className="modal-close" onClick={() => setShowAvanzarModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Estado</label>
              <select
                className="form-select"
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {estadosPosibles.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {selectedEstado === 'CANCELADO' && (
              <div className="form-group">
                <label className="form-label">Motivo (obligatorio para cancelar)</label>
                <textarea
                  className="form-textarea"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleAvanzar}
                disabled={!selectedEstado || saving}
              >
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAvanzarModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PedidoDetail
