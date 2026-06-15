interface SkeletonProps {
  className?: string
  [key: string]: unknown
}

function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`
        rounded-lg bg-stone-200 dark:bg-stone-700/50
        animate-pulse
        ${className}
      `}
      {...props}
    />
  )
}

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="card" style={{ padding: '12px' }}>
      <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <Skeleton
                      className={`h-4 ${c === 0 ? 'w-8' : c === cols - 1 ? 'w-16' : 'w-32'}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

interface FormSkeletonProps {
  fields?: number
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="card">
      <Skeleton className="h-6 w-40 mb-6" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="form-group">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 mt-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export default Skeleton
