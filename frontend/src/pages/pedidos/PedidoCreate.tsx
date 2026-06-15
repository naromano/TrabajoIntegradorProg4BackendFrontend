import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createPedido, getProductos, getUsuarios, getDirecciones } from '../../api/endpoints'
import { FormaPago } from '../../types/pedido'
import { User } from '../../types/user'
import { Producto } from '../../types/producto'

interface PedidoFormData {
  usuario_id: string
  direccion_id: string
  forma_pago_codigo: FormaPago
  notas: string
}

interface FormItem {
  producto_id: string
  cantidad: number
  personalizacion: number[]
}

interface Direccion {
  id: number
  usuario_id: number
  alias?: string
  linea1?: string
  ciudad?: string
}

function PedidoCreate() {
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState<User[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const [formData, setFormData] = useState<PedidoFormData>({
    usuario_id: '',
    direccion_id: '',
    forma_pago_codigo: 'EFECTIVO',
    notas: ''
  })

  const [items, setItems] = useState<FormItem[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usuariosRes, productosRes] = await Promise.all([
        getUsuarios({ limit: 100 }),
        getProductos({ limit: 100 })
      ])
      setUsuarios(usuariosRes.data.data || [])
      setProductos(productosRes.data.data || [])
    } catch (err: unknown) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleDireccionChange = async (usuarioId: string) => {
    setFormData({
      ...formData,
      usuario_id: usuarioId,
      direccion_id: ''
    })
    
    if (usuarioId) {
      try {
        const response = await getDirecciones({ limit: 100 })
        const dirs = (response.data.data as unknown as Direccion[]) || []
        const usuarioDirs = dirs.filter(d => d.usuario_id === parseInt(usuarioId))
        setDirecciones(usuarioDirs)
      } catch (err: unknown) {
        console.error('Error:', err)
      }
    }
  }

  const [direcciones, setDirecciones] = useState<Direccion[]>([])

  const addItem = () => {
    setItems([...items, { producto_id: '', cantidad: 1, personalizacion: [] }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const getProductoPrecio = (productoId: string) => {
    const producto = productos.find(p => p.id === parseInt(productoId))
    return producto?.precio_base || 0
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const precio = getProductoPrecio(item.producto_id)
      return total + (precio * item.cantidad)
    }, 0) + 50
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.usuario_id) {
      setError('Debe seleccionar un usuario')
      return
    }

    if (items.length === 0) {
      setError('Debe agregar al menos un producto')
      return
    }

    const validItems = items.filter(i => i.producto_id && i.cantidad > 0)
    if (validItems.length === 0) {
      setError('Los items deben tener producto y cantidad')
      return
    }

    setSaving(true)

    try {
      const data = {
        usuario_id: parseInt(formData.usuario_id),
        direccion_id: formData.direccion_id ? parseInt(formData.direccion_id) : null,
        forma_pago_codigo: formData.forma_pago_codigo,
        notas: formData.notas || null,
        items: validItems.map(item => ({
          producto_id: parseInt(item.producto_id),
          cantidad: parseInt(String(item.cantidad)),
          personalizacion: item.personalizacion?.length > 0 ? item.personalizacion : null
        }))
      }

      await createPedido(data)
      navigate('/pedidos')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al crear pedido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>


  const productosDisponibles = productos

  return (
    <div>
      <div className="card-header">
        <h1>Nuevo Pedido</h1>
        <Link to="/pedidos" className="btn btn-secondary">Volver</Link>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <h3>Datos del Pedido</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <select
                name="usuario_id"
                className="form-select"
                value={formData.usuario_id}
                onChange={(e) => handleDireccionChange(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección de Entrega</label>
              <select
                name="direccion_id"
                className="form-select"
                value={formData.direccion_id}
                onChange={handleFormChange}
              >
                <option value="">Retiro en local</option>
                {direcciones.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.alias || d.linea1} - {d.ciudad}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Forma de Pago</label>
              <select
                name="forma_pago_codigo"
                className="form-select"
                value={formData.forma_pago_codigo}
                onChange={handleFormChange}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="MERCADOPAGO">MercadoPago</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              name="notas"
              className="form-textarea"
              value={formData.notas}
              onChange={handleFormChange}
              rows={2}
              placeholder="Observaciones del pedido..."
            />
          </div>

          <h3 style={{ marginTop: '30px' }}>Items del Pedido</h3>

          {items.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'flex-end',
                marginBottom: '15px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}
            >
              <div style={{ flex: 2 }}>
                <label className="form-label">Producto</label>
                <select
                  className="form-select"
                  value={item.producto_id}
                  onChange={(e) => updateItem(index, 'producto_id', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {productosDisponibles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} - ${p.precio_base} 
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  className="form-input"
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                  min="1"
                />
              </div>

              <div style={{ flex: 1 }}>
                <label className="form-label">Subtotal</label>
                <span style={{ fontWeight: 'bold' }}>
                  ${(getProductoPrecio(item.producto_id) * item.cantidad).toFixed(2)}
                </span>
              </div>

              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={() => removeItem(index)}
              >
                X
              </button>
            </div>
          ))}

          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={addItem}
            style={{ marginBottom: '20px' }}
          >
            + Agregar Producto
          </button>

          <div 
            style={{ 
              padding: '20px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '8px',
              marginTop: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotal:</span>
              <span>${items.reduce((t, i) => t + (getProductoPrecio(i.producto_id) * i.cantidad), 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Costo Envío:</span>
              <span>$50.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Pedido'}
            </button>
            <Link to="/pedidos" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PedidoCreate
