import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (n: number) => void
  totalItems?: number
}

export function Pagination({ page, totalPages, onChange, itemsPerPage, onItemsPerPageChange, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  const range = 1
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:bg-primary-dim hover:text-primary-light disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={13} /> Anterior
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1 text-[11px] text-muted">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[11px] font-medium transition-colors ${
                p === page
                  ? 'bg-primary-dim text-primary-light'
                  : 'text-muted hover:bg-primary-dim/50 hover:text-muted-light'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:bg-primary-dim hover:text-primary-light disabled:pointer-events-none disabled:opacity-30"
        >
          Siguiente <ChevronRight size={13} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <span className="text-[11px] text-muted">{totalItems} resultado{totalItems !== 1 ? 's' : ''}</span>
        )}
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-muted outline-none"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / pág</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
