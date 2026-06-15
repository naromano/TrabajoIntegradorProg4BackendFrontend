import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCategoriaById, createCategoria, updateCategoria, getCategorias, uploadImage } from '../../api/endpoints'
import { Categoria } from '../../types/categoria'

interface FormData {
  nombre: string
  descripcion: string
  parent_id: number | null
  imagen_url: string
}

function CategoriaForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    parent_id: null,
    imagen_url: ''
  })
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [categoriaSearchQuery, setCategoriaSearchQuery] = useState('')
  const [categoriaSearchResults, setCategoriaSearchResults] = useState<Categoria[]>([])
  const [hasSearchedCategorias, setHasSearchedCategorias] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const catRes = await getCategorias({ limit: 100 })
      setCategorias(catRes.data.data || [])

      if (isEdit) {
        const res = await getCategoriaById(Number(id))
        setFormData({
          nombre: res.data.nombre || '',
          descripcion: res.data.descripcion || '',
          parent_id: res.data.parent_id || null,
          imagen_url: res.data.imagen_url || ''
        })
      }
    } catch (err: unknown) {
      console.error('Error:', err)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value === '' ? null : value
    })
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const res = await uploadImage(file, 'categorias')
      setFormData((prev) => ({ ...prev, imagen_url: res.data.url }))
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al subir imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
      }
      if (isEdit) {
        await updateCategoria(Number(id), payload as unknown as Record<string, unknown>)
      } else {
        await createCategoria(payload as unknown as Record<string, unknown>)
      }
      navigate('/categorias')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoriaSearch = () => {
    setHasSearchedCategorias(true)
    const query = categoriaSearchQuery.trim().toLowerCase()
    if (!query) {
      setCategoriaSearchResults([])
      return
    }
    const results = categorias
      .filter((cat) => cat.nombre.toLowerCase().includes(query) && cat.id !== (id ? Number(id) : 0))
    setCategoriaSearchResults(results)
  }

  const handleSelectCategoriaPadre = (catId: number | null) => {
    setFormData(prev => ({ ...prev, parent_id: catId }))
    setCategoriaSearchQuery('')
    setCategoriaSearchResults([])
  }

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? 'Editar' : 'Nueva'} Categoría</h1>
        <Link to="/categorias" className="btn btn-secondary">Volver</Link>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-input"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              className="form-textarea"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Categoría Padre</label>

            {formData.parent_id ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                }}
              >
                <span>
                  <strong>Categoría seleccionada:</strong>{' '}
                  {categorias.find((c) => c.id === formData.parent_id)?.nombre || `ID ${formData.parent_id}`}
                </span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    handleSelectCategoriaPadre(null)
                    setCategoriaSearchQuery('')
                    setCategoriaSearchResults([])
                  }}
                >
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Escribí la categoría..."
                    value={categoriaSearchQuery}
                    onChange={(e) => {
                      setCategoriaSearchQuery(e.target.value)
                      setHasSearchedCategorias(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCategoriaSearch()
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCategoriaSearch}
                  >
                    Buscar
                  </button>
                </div>

                {categoriaSearchResults.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {categoriaSearchResults.map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        onClick={() => {
                          handleSelectCategoriaPadre(cat.id)
                        }}
                      >
                        <span>{cat.nombre}</span>
                        <span style={{ fontSize: '0.8em', color: '#888' }}>
                          Seleccionar
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {hasSearchedCategorias && categoriaSearchResults.length === 0 && (
                  <p style={{ color: '#999', fontSize: '0.85em', marginTop: '4px' }}>
                    No se encontraron categorías con ese nombre.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
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
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/categorias" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoriaForm
