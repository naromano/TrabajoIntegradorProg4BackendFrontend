import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPedidos } from '../../api/endpoints'
import { useToast } from '../../context/ToastContext'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { useWebSocket } from '../../hooks/useWebSocket'
import { PedidoListItem, EstadoPedido } from '../../types/pedido'
import { WSMessage } from '../../types/websocket'

const PAGE_SIZE = 12

interface Column {
  key: string
  label: string
  render?: (val: unknown, item: PedidoListItem) => JSX.Element | string
}

function PedidoList() {
  const toast = useToast()
  const [pedidos, setPedidos] = useState<PedidoListItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroPedidoId, setFiltroPedidoId] = useState<string>('')
  const [filtroCliente, setFiltroCliente] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)

  const fetchPedidos = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const offset = (pageNum - 1) * PAGE_SIZE
      const params: Record<string, string | number> = { offset, limit: PAGE_SIZE }
      if (filtroEstado) params.estado = filtroEstado
      if (filtroPedidoId) params.pedido_id = Number(filtroPedidoId)
      if (filtroCliente) params.nombre_cliente = filtroCliente
      const response = await getPedidos(params)
      setPedidos(response.data.data || [])
      setTotal(response.data.total || 0)
      setTotalPages(Math.ceil((response.data.total || 0) / PAGE_SIZE))
    } catch (err: unknown) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidos(page)
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPedidos(1)
  }, [filtroEstado, filtroPedidoId, filtroCliente])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchPedidos(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const navigate = useNavigate()

  const fetchPedidosRef = useRef(fetchPedidos)
  fetchPedidosRef.current = fetchPedidos
  const pageRef = useRef(page)
  pageRef.current = page

  const handleWsMessage = useCallback((msg: WSMessage) => {
    if (msg.event === "WS_CONNECTED") {
      fetchPedidosRef.current(pageRef.current)
      return
    }
    const d = msg.data
    if (msg.event === "estado_cambiado") {
      if (d?.estado_anterior === null) {
        fetchPedidosRef.current(pageRef.current)
      } else {
        setPedidos(prev => prev.map(p => p.id === d?.pedido_id ? { ...p, estado_codigo: d?.estado_nuevo as EstadoPedido } : p))
      }
      return
    }
    if (msg.event === "pedido_cancelado") {
      setPedidos(prev => prev.map(p => p.id === d?.pedido_id ? { ...p, estado_codigo: d?.estado_nuevo as EstadoPedido } : p))
      toast?.info(`Pedido #${d?.pedido_id} cancelado`)
      return
    }
  }, [toast])

  const { connected } = useWebSocket({ onMessage: handleWsMessage, enabled: true })

  const columns: Column[] = [
    { key: 'id', label: '# Pedido' },
    { key: 'usuario_nombre', label: 'Cliente' },
    {
      key: 'estado_codigo',
      label: 'Estado',
      render: (val) => (
        <span className={`badge ${getEstadoBadge(val as string)}`}>
          {String(val)}
        </span>
      )
    },
    { key: 'forma_pago_codigo', label: 'Forma de Pago' },
    {
      key: 'total',
      label: 'Total',
      render: (val) => `$${val}`
    },
    {
      key: 'created_at',
      label: 'Fecha',
      render: (val) => new Date(val as string).toLocaleString()
    }
  ]

  return (
    <div>
      <div className="card-header">
        <div className="flex items-center gap-3">
          <h1 className="card-title">Pedidos</h1>
          {!loading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {pedidos.length} de {total}
            </span>
          )}
          {connected && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Estado</label>
            <select
              className="filtro-input"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="CONFIRMADO">CONFIRMADO</option>
              <option value="EN_PREP">EN_PREP</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div className="filtro-group">
            <label className="filtro-label"># Pedido</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Buscar por número..."
              value={filtroPedidoId}
              onChange={(e) => setFiltroPedidoId(e.target.value)}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Cliente</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Buscar por nombre..."
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={pedidos}
          columns={columns}
          onEdit={(p) => navigate(`/pedidos/${p.id}`)}
          loading={loading}
          emptyMessage="No hay pedidos"
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  )
}

export default PedidoList