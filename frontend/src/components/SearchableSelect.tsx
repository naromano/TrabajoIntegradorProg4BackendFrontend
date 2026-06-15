import { useState, useRef, useEffect } from 'react'

interface SearchableSelectProps {
  options: Record<string, unknown>[]
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
  labelKey?: string
  valueKey?: string
}

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Buscar...',
  labelKey = 'nombre',
  valueKey = 'id',
}: SearchableSelectProps) {
  const [query, setQuery] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const selected = options.find((o) => o[valueKey] === value)

  const filtered = query.trim()
    ? options.filter((o) =>
        String(o[labelKey]).toLowerCase().includes(query.toLowerCase())
      )
    : options

  const handleSelect = (option: Record<string, unknown>): void => {
    onChange(option[valueKey])
    setQuery('')
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={open ? query : (selected ? String(selected[labelKey]) : '')}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: 200,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '10px', color: '#999' }}>
              Sin resultados
            </div>
          ) : (
            filtered.map((option) => (
              <div
                key={String(option[valueKey])}
                onClick={() => handleSelect(option)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  backgroundColor:
                    option[valueKey] === value ? '#f0f0ff' : '#fff',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.backgroundColor = '#f5f5ff')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) =>
                  (e.currentTarget.style.backgroundColor =
                    option[valueKey] === value ? '#f0f0ff' : '#fff')
                }
              >
                {String(option[labelKey])}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
