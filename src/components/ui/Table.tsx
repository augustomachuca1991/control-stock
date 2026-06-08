import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  renderCard?: (item: T) => ReactNode
  onRowClick?: (item: T) => void
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'Sin datos', renderCard, onRowClick }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-muted">{emptyMessage}</p>
    )
  }

  return (
    <>
      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.8px] text-muted"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                 key={keyExtractor(item)}
                 onClick={() => onRowClick?.(item)}
                 className={`border-b border-border/50 last:border-0 hover:bg-primary-dim/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-2.5 pr-4 text-text">
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-2 md:hidden">
        {data.map((item) => (
          <div 
              key={keyExtractor(item)}  
              onClick={() => onRowClick?.(item)}
              className={`rounded-lg border border-border bg-surface p-3 ${onRowClick ? 'cursor-pointer' : ''}`}
          >
            {renderCard ? renderCard(item) : columns.map((col) => ( // ← usás renderCard si existe
              <div key={col.key} className="flex items-center justify-between py-1 text-[12px]">
                <span className="text-muted">{col.header}</span>
                <span className="text-text">
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}