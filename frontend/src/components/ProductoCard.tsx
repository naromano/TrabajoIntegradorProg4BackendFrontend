import { useNavigate } from 'react-router-dom'

interface ProductoCardProps {
  id: number
  nombre: string
  precio: number
  stock: number
  disponible: boolean
  userRol: string
  onToggleDisponibilidad: (id: number) => void
  onEditar: (id: number) => void
}

function ProductoCard({
  id,
  nombre,
  precio,
  stock,
  disponible,
  userRol,
  onToggleDisponibilidad,
  onEditar,
}: ProductoCardProps) {
  const isAdmin = userRol === 'ADMIN'
  const canToggle = isAdmin || userRol === 'STOCK'

  return (
    <div className="card flex flex-col gap-3">
      <h3 className="card-title text-lg font-bold">{nombre}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Precio:</span>{' '}
          <span className="font-semibold">${precio}</span>
        </div>
        <div>
          <span className="text-gray-500">Stock:</span>{' '}
          <span className="font-semibold">{stock}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Disponible:</span>{' '}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              disponible
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {disponible ? 'Sí' : 'No'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {isAdmin && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onEditar(id)}
          >
            Editar
          </button>
        )}

        {canToggle && (
          <button
            className={`btn btn-sm ${
              disponible ? 'btn-danger' : 'btn-success'
            }`}
            onClick={() => onToggleDisponibilidad(id)}
          >
            {disponible ? 'Desactivar' : 'Activar'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductoCard
