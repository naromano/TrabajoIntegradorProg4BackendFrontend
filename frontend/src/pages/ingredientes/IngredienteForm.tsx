import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getIngredienteById, createIngrediente, updateIngrediente, getUnidadesMedida, uploadImage } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { Ingrediente } from '../../types/ingrediente'
import { UnidadMedida } from '../../types/unidad'

interface FormData {
  nombre: string
  descripcion: string
  es_alergeno: boolean
  stock_cantidad: number
  costo: number
  imagen_url: string
  unidad_medida_id: string
}

function IngredienteForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { user } = useAuth()
  const isStock = user?.rol === "STOCK"
  const readOnly = isStock && isEdit

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    es_alergeno: false,
    stock_cantidad: 0,
    costo: 0,
    imagen_url: '',
    unidad_medida_id: ''
  })
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const uniRes = await getUnidadesMedida({ limit: 100 })
      setUnidades(uniRes.data || [])

      if (isEdit) {
        const response = await getIngredienteById(Number(id))
        setFormData({
          nombre: response.data.nombre || '',
          descripcion: response.data.descripcion || '',
          es_alergeno: response.data.es_alergeno || false,
          stock_cantidad: response.data.stock_cantidad || 0,
          costo: response.data.costo ?? 0,
          imagen_url: response.data.imagen_url || '',
          unidad_medida_id: String(response.data.unidad_medida_id ?? '')
        })
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      if (isEdit) navigate('/ingredientes')
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    })
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const res = await uploadImage(file, 'ingredientes')
      setFormData((prev) => ({ ...prev, imagen_url: res.data.url }))
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al subir imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!readOnly) {
      if (!formData.nombre.trim()) {
        setError("El nombre del ingrediente es obligatorio")
        return
      }

      if (!formData.unidad_medida_id) {
        setError("Seleccioná una unidad de medida")
        return
      }
    }

    setError('')
    setLoading(true)

    try {
      if (readOnly) {
        await updateIngrediente(Number(id), { stock_cantidad: parseFloat(String(formData.stock_cantidad)) || 0 } as unknown as Record<string, unknown>)
      } else {
        const payload = {
          ...formData,
          stock_cantidad: parseFloat(String(formData.stock_cantidad)) || 0,
          unidad_medida_id: formData.unidad_medida_id ? parseInt(formData.unidad_medida_id) : null,
        }

        if (isEdit) {
          await updateIngrediente(Number(id), payload as unknown as Record<string, unknown>)
        } else {
          await createIngrediente(payload as unknown as Record<string, unknown>)
        }
      }
      navigate('/ingredientes')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? 'Editar' : 'Nuevo'} Ingrediente</h1>
        <Link to="/ingredientes" className="btn btn-secondary">Volver</Link>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        {readOnly && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#1e40af", fontSize: "0.9em" }}>
            Rol STOCK: solo podés modificar el stock del ingrediente.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!readOnly && (
            <>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-input"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              className="form-textarea"
              value={formData.descripcion || ''}
              onChange={handleChange}
              rows={3}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="es_alergeno"
                checked={formData.es_alergeno}
                onChange={handleChange}
                disabled={readOnly}
              />{' '}
              Es alérgeno
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage || readOnly}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {uploadingImage && (
              <small style={{ color: '#888' }}>Subiendo imagen...</small>
            )}
            {formData.imagen_url && (
              <div style={{ marginTop: '8px' }}>
                <img
                  src={formData.imagen_url}
                  alt="Preview"
                  style={{
                    maxWidth: '150px',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    objectFit: 'cover',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: '8px' }}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imagen_url: '' }))
                  }
                  disabled={readOnly}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">Stock / Cantidad</label>
              <input
                type="number"
                name="stock_cantidad"
                className="form-input"
                value={formData.stock_cantidad}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unidad de Medida</label>
              <select
                name="unidad_medida_id"
                className="form-select"
                value={formData.unidad_medida_id}
                onChange={handleChange}
                disabled={readOnly}
              >
                <option value="">Sin unidad</option>
                {unidades.map(uni => (
                  <option key={uni.id} value={String(uni.id)}>{uni.nombre} ({uni.simbolo})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Costo (por 1 unidad base)</label>
            <input
              type="number"
              name="costo"
              className="form-input"
              value={formData.costo}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Ej: 1000 (lo que te sale 1 kg, 1 L o 1 unidad)"
              disabled={readOnly}
            />
            <small style={{ color: '#888' }}>
              ¿Cuánto te sale 1 {unidades.find(u => u.id == parseInt(formData.unidad_medida_id))?.simbolo || 'unidad'} de este ingrediente?
            </small>
          </div>
          </>)}
          {readOnly && (
            <>
            <div className="form-group">
              <label className="form-label">Ingrediente</label>
              <input
                type="text"
                className="form-input"
                value={formData.nombre}
                disabled
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                name="stock_cantidad"
                className="form-input"
                value={formData.stock_cantidad}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : readOnly ? 'Actualizar stock' : 'Guardar'}
            </button>
            <Link to="/ingredientes" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IngredienteForm
