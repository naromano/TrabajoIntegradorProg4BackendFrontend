import { useState, useEffect } from 'react'
import { getProductos, updateProducto, getIngredientes, updateIngrediente, getCategorias } from '../../api/endpoints'
import Pagination from '../../components/Pagination'
import type { Producto } from '../../types/producto'
import type { Ingrediente } from '../../types/ingrediente'
import type { Categoria } from '../../types/categoria'

const PAGE_SIZE = 10

type Modo = 'agregar' | 'establecer'

function StockUpdate() {
  const [tab, setTab] = useState<'productos' | 'ingredientes'>('productos')
  const [modo, setModo] = useState<Modo>('agregar')

  return (
    <div>
      <div className="card-header">
        <h1>Actualizar Stock</h1>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setTab('productos')}
              style={{
                padding: '10px 20px', border: 'none',
                background: tab === 'productos' ? '#eef2ff' : 'transparent',
                color: tab === 'productos' ? '#4f46e5' : '#6b7280',
                fontWeight: tab === 'productos' ? 600 : 400,
                borderBottom: tab === 'productos' ? '2px solid #4f46e5' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Productos
            </button>
            <button
              onClick={() => setTab('ingredientes')}
              style={{
                padding: '10px 20px', border: 'none',
                background: tab === 'ingredientes' ? '#eef2ff' : 'transparent',
                color: tab === 'ingredientes' ? '#4f46e5' : '#6b7280',
                fontWeight: tab === 'ingredientes' ? 600 : 400,
                borderBottom: tab === 'ingredientes' ? '2px solid #4f46e5' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Ingredientes
            </button>
          </div>
          <div style={{ display: 'flex', gap: '2px', paddingBottom: '8px', paddingRight: '8px' }}>
            <button
              onClick={() => setModo('agregar')}
              style={{
                padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '6px 0 0 6px',
                background: modo === 'agregar' ? '#4f46e5' : '#fff',
                color: modo === 'agregar' ? '#fff' : '#6b7280',
                fontSize: '0.8em', fontWeight: 500, cursor: 'pointer', transition: 'all 0.1s',
              }}
            >
              + Agregar
            </button>
            <button
              onClick={() => setModo('establecer')}
              style={{
                padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '0 6px 6px 0',
                background: modo === 'establecer' ? '#4f46e5' : '#fff',
                color: modo === 'establecer' ? '#fff' : '#6b7280',
                fontSize: '0.8em', fontWeight: 500, cursor: 'pointer', transition: 'all 0.1s',
              }}
            >
              = Establecer
            </button>
          </div>
        </div>

        {tab === 'productos' ? <ProductosTab modo={modo} /> : <IngredientesTab modo={modo} />}
      </div>
    </div>
  )
}

function ProductosTab({ modo }: { modo: Modo }) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<number | ''>('')
  const [increments, setIncrements] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState<Record<number, boolean>>({})

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchProductos = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const offset = (pageNum - 1) * PAGE_SIZE
      const params: Record<string, unknown> = { offset, limit: PAGE_SIZE }
      if (filtroNombre) params.nombre = filtroNombre
      if (filtroCategoriaId) params.categoria_id = Number(filtroCategoriaId)
      params.sin_ingredientes = true
      const res = await getProductos(params)
      const data = (res.data.data || []) as Producto[]
      setProductos(data)
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProductos(page) }, [page])
  useEffect(() => { setPage(1); fetchProductos(1) }, [filtroNombre, filtroCategoriaId])

  useEffect(() => {
    getCategorias({ limit: 100 }).then(res => setCategorias((res.data.data || []) as Categoria[])).catch(() => {})
  }, [])

  const handleSave = async (id: number, stockActual: number) => {
    const valor = parseInt(increments[id]) || 0
    if (valor <= 0 && modo === 'agregar') return
    if (modo === 'establecer' && increments[id] === '') return
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      const nuevoStock = modo === 'agregar' ? stockActual + valor : valor
      await updateProducto(id, { stock_cantidad: nuevoStock } as unknown as Record<string, unknown>)
      setProductos(prev => prev.map(p => p.id === id ? { ...p, stock_cantidad: nuevoStock } : p))
      setIncrements(prev => ({ ...prev, [id]: '' }))
      setSaved(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 1500)
    } catch (err) {
      alert((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const label = modo === 'agregar' ? 'Agregar stock' : 'Nuevo stock'
  const placeholder = modo === 'agregar' ? '+cantidad' : '0'

  return (
    <>
      <div className="filtros" style={{ marginBottom: '12px' }}>
        <div className="filtro-group">
          <label className="filtro-label">Buscar</label>
          <input type="text" className="filtro-input" placeholder="Nombre..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
        </div>
        <div className="filtro-group">
          <label className="filtro-label">Categoría</label>
          <select className="filtro-input" value={filtroCategoriaId} onChange={(e) => setFiltroCategoriaId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#999' }}>Cargando...</p>
      ) : productos.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#999' }}>No hay productos sin ingredientes</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th style={{ width: '110px' }}>Stock actual</th>
                <th style={{ width: '130px' }}>{label}</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td style={{ color: (p.stock_cantidad || 0) === 0 ? '#ef4444' : '#374151' }}>{p.stock_cantidad || 0}</td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={increments[p.id] ?? ''}
                      onChange={(e) => setIncrements(prev => ({ ...prev, [p.id]: e.target.value }))}
                      style={{ width: '90px', padding: '4px 8px' }}
                      min="0"
                      step="1"
                      placeholder={placeholder}
                    />
                  </td>
                  <td>
                    {saved[p.id] ? (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '1.2em' }}>✓</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSave(p.id, p.stock_cantidad || 0)}
                        disabled={saving[p.id]}
                      >
                        {saving[p.id] ? '...' : 'Guardar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  )
}

function IngredientesTab({ modo }: { modo: Modo }) {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filtroNombre, setFiltroNombre] = useState('')
  const [increments, setIncrements] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState<Record<number, boolean>>({})

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchIngredientes = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const offset = (pageNum - 1) * PAGE_SIZE
      const params: Record<string, unknown> = { offset, limit: PAGE_SIZE }
      if (filtroNombre) params.nombre = filtroNombre
      const res = await getIngredientes(params)
      const data = (res.data.data || []) as Ingrediente[]
      setIngredientes(data)
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIngredientes(page) }, [page])
  useEffect(() => { setPage(1); fetchIngredientes(1) }, [filtroNombre])

  const handleSave = async (id: number, stockActual: number) => {
    const valor = parseFloat(increments[id]) || 0
    if (valor <= 0 && modo === 'agregar') return
    if (modo === 'establecer' && increments[id] === '') return
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      const nuevoStock = modo === 'agregar' ? stockActual + valor : valor
      await updateIngrediente(id, { stock_cantidad: nuevoStock } as unknown as Record<string, unknown>)
      setIngredientes(prev => prev.map(i => i.id === id ? { ...i, stock_cantidad: nuevoStock } : i))
      setIncrements(prev => ({ ...prev, [id]: '' }))
      setSaved(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 1500)
    } catch (err) {
      alert((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const label = modo === 'agregar' ? 'Agregar stock' : 'Nuevo stock'
  const placeholder = modo === 'agregar' ? '+cantidad' : '0'

  return (
    <>
      <div className="filtros" style={{ marginBottom: '12px' }}>
        <div className="filtro-group">
          <label className="filtro-label">Buscar</label>
          <input type="text" className="filtro-input" placeholder="Nombre..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#999' }}>Cargando...</p>
      ) : ingredientes.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#999' }}>No hay ingredientes</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th style={{ width: '110px' }}>Stock actual</th>
                <th style={{ width: '130px' }}>{label}</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map(i => (
                <tr key={i.id}>
                  <td>{i.nombre}</td>
                  <td style={{ color: (i.stock_cantidad || 0) === 0 ? '#ef4444' : '#374151' }}>{i.stock_cantidad || 0}</td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={increments[i.id] ?? ''}
                      onChange={(e) => setIncrements(prev => ({ ...prev, [i.id]: e.target.value }))}
                      style={{ width: '90px', padding: '4px 8px' }}
                      min="0"
                      step="0.01"
                      placeholder={placeholder}
                    />
                  </td>
                  <td>
                    {saved[i.id] ? (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '1.2em' }}>✓</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSave(i.id, i.stock_cantidad || 0)}
                        disabled={saving[i.id]}
                      >
                        {saving[i.id] ? '...' : 'Guardar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  )
}

export default StockUpdate