import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  let start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  start = Math.max(1, end - 4)

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const navButtonClass = cn(
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-industrial-200 bg-white px-4 text-sm font-semibold text-industrial-950 shadow-sm transition',
  'hover:bg-industrial-50 disabled:cursor-not-allowed disabled:text-industrial-300 disabled:hover:bg-white'
)

const pageButtonClass = cn(
  'flex h-9 min-w-9 items-center justify-center rounded-lg border border-industrial-200 bg-white px-2 text-sm font-bold text-industrial-950 shadow-sm transition hover:bg-industrial-50'
)

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageWindow(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-industrial-500 text-sm">
        Página <strong className="text-industrial-950 font-bold">{page}</strong> de {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={navButtonClass}
        >
          <span aria-hidden="true">&lt;</span>
          Anterior
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              p === page
                ? 'bg-industrial-950 flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-bold text-white'
                : pageButtonClass
            )}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={navButtonClass}
        >
          Próxima
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
    </div>
  )
}
