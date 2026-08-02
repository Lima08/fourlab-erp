/**
 * Espelha a estrutura do ProjectCard (padding, badges, progresso, CTA)
 * para reservar altura e evitar layout shift na listagem.
 */
export function ProjectCardSkeleton() {
  return (
    <div
      className="border-industrial-300 relative flex h-full min-h-70 flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm"
      aria-hidden
    >
      <div className="bg-industrial-200 absolute left-0 w-1.5 inset-y-0" />

      <div className="flex flex-1 flex-col p-5 md:p-8">
        <div className="flex items-start gap-2">
          <div className="bg-industrial-200 h-7 flex-1 animate-pulse rounded-md" />
          <div className="bg-industrial-200 shrink-0 animate-pulse rounded-lg size-11" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <div className="bg-industrial-100 h-6 w-28 animate-pulse rounded-full" />
          <div className="bg-industrial-100 h-6 w-24 animate-pulse rounded-full" />
          <div className="bg-industrial-100 h-6 w-32 animate-pulse rounded-full" />
        </div>

        <div className="mt-3 space-y-2">
          <div className="bg-industrial-100 h-4 w-full animate-pulse rounded" />
          <div className="bg-industrial-100 h-4 w-4/5 animate-pulse rounded" />
        </div>

        <div className="bg-industrial-100 mt-2 h-4 w-2/5 animate-pulse rounded" />
        <div className="bg-industrial-100 mt-2 h-4 w-3/5 animate-pulse rounded" />

        <div className="mt-auto space-y-2 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="bg-industrial-100 h-3 w-36 animate-pulse rounded" />
            <div className="bg-industrial-100 h-3 w-20 animate-pulse rounded" />
          </div>
          <div className="bg-industrial-100 h-2 w-full animate-pulse rounded-full" />
        </div>
      </div>

      <div className="border-industrial-200 bg-industrial-50 border-t-2 p-4">
        <div className="bg-industrial-200 h-14 w-full animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
