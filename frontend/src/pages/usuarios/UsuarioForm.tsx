import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUsuarioById, createUsuario, updateUsuario, getUsuarioRoles, assignRole, removeRole } from '../../api/endpoints'

interface UsuarioFormData {
  nombre: string
  apellido: string
  email: string
  password: string
  celular: string
}

const ROLE_OPTIONS = ['CLIENTE', 'PEDIDOS', 'STOCK', 'ADMIN']

function UsuarioForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState<UsuarioFormData>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    celular: ''
  })
  const [rol, setRol] = useState('CLIENTE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      fetchUsuario()
    }
  }, [id])

  const fetchUsuario = async () => {
    if (!id) return
    try {
      const [usuarioRes, rolesRes] = await Promise.all([
        getUsuarioById(Number(id)),
        getUsuarioRoles(Number(id)),
      ])
      const user = usuarioRes.data
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        password: '',
        celular: String(user.celular || ''),
      })
      const currentRoles = (rolesRes.data.data || []).map((r: { rol_codigo: string }) => r.rol_codigo)
      setRol(currentRoles[0] || 'CLIENTE')
    } catch (err) {
      console.error('Error:', err)
      navigate('/usuarios')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const syncRol = async (usuarioId: number, newRol: string) => {
    const currentRolesRes = await getUsuarioRoles(usuarioId)
    const currentRoles = (currentRolesRes.data.data || []).map(r => r.rol_codigo)
    const toRemove = currentRoles.filter(r => r !== newRol)
    for (const r of toRemove) {
      await removeRole(usuarioId, r)
    }
    if (!currentRoles.includes(newRol)) {
      await assignRole({ usuario_id: usuarioId, rol_codigo: newRol })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {}
        if (formData.password) payload.password = formData.password
        payload.nombre = formData.nombre
        payload.apellido = formData.apellido
        payload.email = formData.email
        payload.celular = formData.celular || null
        await updateUsuario(Number(id!), payload)
        await syncRol(Number(id!), rol || 'CLIENTE')
      } else {
        const res = await createUsuario({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
          celular: formData.celular || null,
        } as unknown as Record<string, unknown>)
        const newId = (res.data as { id: number }).id
        if (newId) {
          await syncRol(newId, rol || 'CLIENTE')
        }
      }
      navigate('/usuarios')
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? 'Editar' : 'Nuevo'} Usuario</h1>
        <Link to="/usuarios" className="btn btn-secondary">Volver</Link>
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
            <label className="form-label">Apellido</label>
            <input
              type="text"
              name="apellido"
              className="form-input"
              value={formData.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password {isEdit && '(dejar en blanco para mantener)'}
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required={!isEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Celular</label>
            <input
              type="text"
              name="celular"
              className="form-input"
              value={formData.celular || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol</label>
            <select
              name="rol"
              className="form-select"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/usuarios" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsuarioForm