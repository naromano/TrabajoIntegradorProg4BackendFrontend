import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getArbolCategorias, deleteCategoria } from '../../api/endpoints'
import Modal from '../../components/Modal'
import { CategoriaNodo } from '../../types/categoria'

interface NodoArbolProps {
  nodo: CategoriaNodo
  onEdit: (c: CategoriaNodo) => void
  onDelete: (c: CategoriaNodo) => void
  depth?: number
}

function NodoArbol({ nodo, onEdit, onDelete, depth = 0 }: NodoArbolProps) {
  const [expandido, setExpandido] = useState<boolean>(depth < 2)
  const tieneHijos = nodo.children && nodo.children.length > 0

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          paddingLeft: `${20 + depth * 24}px`,
          borderRadius: '6px',
          marginBottom: '2px',
          backgroundColor: depth % 2 === 0 ? '#fff' : '#f8f9fa',
          border: '1px solid #eee',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eef2ff'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = depth % 2 === 0 ? '#fff' : '#f8f9fa'}
      >
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          style={{
            background: 'none',
            border: 'none',
            cursor: tieneHijos ? 'pointer' : 'default',
            width: '20px',
            fontSize: '14px',
            color: tieneHijos ? '#666' : '#ccc',
            padding: 0,
            visibility: tieneHijos ? 'visible' : 'hidden',
          }}
        >
          {expandido ? '▼' : '▶'}
        </button>

        <span style={{ fontSize: '16px', color: tieneHijos ? '#f0ad4e' : '#999' }}>
          {tieneHijos ? '📁' : '📄'}
        </span>

        <span style={{ flex: 1, fontWeight: depth === 0 ? 600 : 400 }}>
          {nodo.nombre}
        </span>

        {nodo.descripcion && (
          <span style={{ color: '#999', fontSize: '0.85em', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nodo.descripcion}
          </span>
        )}

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onEdit(nodo)}
            title="Editar"
            style={{ padding: '2px 8px', fontSize: '0.85em' }}
          >
            ✏️
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(nodo)}
            title="Eliminar"
            style={{ padding: '2px 8px', fontSize: '0.85em' }}
          >
            🗑️
          </button>
        </div>
      </div>

      {expandido && tieneHijos && (
        <div>
          {nodo.children.map((hijo) => (
            <NodoArbol
              key={hijo.id}
              nodo={hijo}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoriaList() {
  const [arbol, setArbol] = useState<CategoriaNodo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaNodo | null>(null)
  const [filtro, setFiltro] = useState<string>('')
  const navigate = useNavigate()

  const fetchArbol = useCallback(async () => {
    try {
      const response = await getArbolCategorias()
      setArbol(response.data || [])
    } catch (err: unknown) {
      console.error('Error al cargar árbol:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArbol()
  }, [fetchArbol])

  const handleEdit = (categoria: CategoriaNodo) => {
    navigate(`/categorias/${categoria.id}/editar`)
  }

  const handleDelete = (categoria: CategoriaNodo) => {
    setCategoriaToDelete(categoria)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteCategoria(categoriaToDelete!.id)
      setShowDeleteModal(false)
      setCategoriaToDelete(null)
      fetchArbol()
    } catch (err: unknown) {
      alert('No se puede eliminar esta categoría porque tiene subcategorías o productos asociados.')
    }
  }

  const aplanarArbol = (nodos: CategoriaNodo[], profundidad: number = 0): (CategoriaNodo & { depth: number })[] => {
    let resultado: (CategoriaNodo & { depth: number })[] = []
    for (const nodo of nodos) {
      resultado.push({ ...nodo, depth: profundidad })
      if (nodo.children) {
        resultado = resultado.concat(aplanarArbol(nodo.children, profundidad + 1))
      }
    }
    return resultado
  }

  const todasLasCats = aplanarArbol(arbol)
  const filtradas = filtro
    ? todasLasCats.filter(c => c.nombre?.toLowerCase().includes(filtro.toLowerCase()))
    : null

  if (loading) {
    return (
      <div>
        <div className="card-header">
          <h1>Categorías</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card-header">
        <h1>Categorías</h1>
        <Link to="/categorias/nueva" className="btn btn-primary" style={{ marginTop: '10px' }}>Nueva Categoría</Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Nombre de categoría..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {filtro ? (
          <div>
            {filtradas!.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                
              </p>
            ) : (
              filtradas!.map((cat) => (
                <div key={cat.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  paddingLeft: `${20 + cat.depth * 24}px`,
                  borderRadius: '6px',
                  marginBottom: '2px',
                  backgroundColor: '#fffbe6',
                  border: '1px solid #eee',
                }}>
                  <span style={{ fontSize: '12px', color: '#999', width: '20px' }}>
                    {cat.depth > 0 ? '↳' : '•'}
                  </span>
                  <span style={{ flex: 1 }}>{cat.nombre}</span>
                  <button type="button" className="btn btn-sm" onClick={() => handleEdit(cat)} style={{ padding: '2px 8px', fontSize: '0.85em' }}>✏️</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)} style={{ padding: '2px 8px', fontSize: '0.85em' }}>🗑️</button>
                </div>
              ))
            )}
          </div>
        ) : arbol.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            No hay categorías todavía. ¡Creá la primera!
          </p>
        ) : (
          arbol.map((nodo) => (
            <NodoArbol
              key={nodo.id}
              nodo={nodo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              depth={0}
            />
          ))
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Categoría"
      >
        <p>¿Estás seguro de eliminar la categoría <strong>{categoriaToDelete?.nombre}</strong>?</p>
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

export default CategoriaList
