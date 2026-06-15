import { TableSkeleton } from './Skeleton'
import type { ReactNode } from 'react'

export interface ColumnDef<T> {
  key: string
  label: string
  render?: (value: unknown, item: T) => ReactNode
}

interface DataTableProps<T extends { id: number }> {
  data: T[]
  columns: ColumnDef<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  emptyType?: string
  emptyAction?: () => void
  emptyActionLabel?: string
}

const emptyIcons: Record<string, ReactNode> = {
  default: (
    <svg className="w-16 h-16 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  usuarios: (
    <svg className="w-16 h-16 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
}

function DataTable<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  loading,
  emptyMessage = 'No hay datos disponibles',
  emptyType = 'default',
  emptyAction,
  emptyActionLabel,
}: DataTableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} cols={columns.length + (onEdit || onDelete ? 1 : 0)} />
  }

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div className="flex justify-center mb-4">
          {emptyIcons[emptyType] || emptyIcons.default}
        </div>
        <p className="empty-text">{emptyMessage}</p>
        <p className="empty-hint">Intentá ajustar los filtros o crear un nuevo registro</p>
        {emptyAction && (
          <button onClick={emptyAction} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
            {emptyActionLabel || 'Crear nuevo'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {(onEdit || onDelete) && <th style={{ width: '140px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render((item as Record<string, unknown>)[col.key], item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td>
                  <div className="table-actions">
                    {onEdit && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onEdit(item)}
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onDelete(item)}
                        title="Eliminar"
                        style={{ color: '#ef4444' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
