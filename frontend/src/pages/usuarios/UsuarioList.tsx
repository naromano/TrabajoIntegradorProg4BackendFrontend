import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUsuarios, deleteUsuario } from '../../api/endpoints'
import DataTable, { type ColumnDef } from '../../components/DataTable'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import type { User } from '../../types/user'

const PAGE_SIZE = 12

function UsuarioList() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<User | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const fetchUsuarios = async (pageNum = 1) => {
    try {
      setLoading(true)
      const offset = (pageNum - 1) * PAGE_SIZE
      const response = await getUsuarios({ offset, limit: PAGE_SIZE, search: filtro || undefined })
      setUsuarios((response.data.data as User[]) || [])
      setTotal(response.data.total || 0)
      setTotalPages(Math.ceil((response.data.total || 0) / PAGE_SIZE))
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios(page)
  }, [])

  useEffect(() => {
    setPage(1)
    fetchUsuarios(1)
  }, [filtro])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchUsuarios(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEdit = (usuario: User) => {
    navigate(`/usuarios/${usuario.id}/editar`)
  }

  const handleDelete = (usuario: User) => {
    setUsuarioToDelete(usuario)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!usuarioToDelete) return
    try {
      await deleteUsuario(usuarioToDelete.id)
      setShowDeleteModal(false)
      setUsuarioToDelete(null)
      fetchUsuarios()
    } catch (err) {
      alert('Error al eliminar usuario')
    }
  }

  const columns: ColumnDef<User>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'email', label: 'Email' },
    {
      key: 'rol',
      label: 'Rol',
      render: (val: unknown) => (val as string) || '-'
    },
    { key: 'celular', label: 'Celular' },
    {
      key: 'activo',
      label: 'Activo',
      render: (val) => (
        <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>
          {val ? 'Sí' : 'No'}
        </span>
      )
    }
  ]

  return (
    <div>
      <div className="card-header">
        <h1>Usuarios</h1>
        <Link to="/usuarios/nuevo" className="btn btn-primary" style={{ marginTop: '10px' }}>Nuevo Usuario</Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Nombre, apellido o email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={usuarios}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay usuarios"
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Usuario"
      >
        <p>¿Estás seguro de eliminar el usuario <strong>{usuarioToDelete?.nombre} {usuarioToDelete?.apellido}</strong>?</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default UsuarioList
