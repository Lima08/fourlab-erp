import { ProjectDetailTopBar } from './ProjectDetailTopBar'

interface Props {
  onBack: () => void
}

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-industrial-200 ${className}`} />
}

/**
 * Espelha InspectionPage (info, status, rail, lista) para reservar altura
 * e evitar layout shift no carregamento do detalhe.
 */
export function ProjectDetailSkeleton({ onBack }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-industrial-50">
      <ProjectDetailTopBar onBack={onBack} />

      <main
        className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8"
        role="status"
        aria-live="polite"
        aria-label="Carregando detalhes do projeto"
      >
        {/* ProjectInfoSection */}
        <section className="rounded-2xl border-2 border-industrial-200 bg-white p-6 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Pulse className="h-9 w-2/3 max-w-md" />
            <div className="flex flex-wrap gap-2">
              <Pulse className="h-6 w-28 rounded-full" />
              <Pulse className="h-6 w-24 rounded-full" />
              <Pulse className="h-6 w-32 rounded-full" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Pulse className="h-4 w-48" />
            <Pulse className="h-4 w-72 max-w-full" />
            <Pulse className="h-4 w-40" />
          </div>
        </section>

        {/* ProjectInspectionStatus */}
        <section className="overflow-hidden rounded-2xl border-2 border-industrial-200 bg-white">
          <div className="px-5 py-4 md:px-6">
            <Pulse className="h-4 w-40" />
          </div>
          <div className="flex flex-col items-center gap-6 px-5 pb-6 pt-1 sm:flex-row md:px-6">
            <Pulse className="size-26 shrink-0 rounded-full" />
            <div className="grid w-full flex-1 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="flex min-h-18 flex-col gap-2 rounded-xl border-2 border-industrial-100 bg-industrial-50 px-3 py-2.5"
                >
                  <Pulse className="h-3 w-16 bg-industrial-100" />
                  <Pulse className="h-7 w-12 bg-industrial-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col items-stretch gap-6 md:flex-row md:gap-8">
          {/* LocationsRail (collapsed width) */}
          <aside className="hidden w-18 shrink-0 md:block">
            <div className="flex flex-col gap-2 overflow-hidden rounded-2xl border-2 border-industrial-200 bg-white p-2">
              <Pulse className="mx-auto rounded-lg size-9" />
              {Array.from({ length: 4 }, (_, i) => (
                <Pulse key={i} className="mx-auto rounded-lg size-9" />
              ))}
            </div>
          </aside>

          {/* ItemsListSection */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Pulse className="h-10 flex-1 rounded-lg" />
              <Pulse className="h-10 w-36 rounded-lg" />
            </div>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-xl border-2 border-industrial-200 bg-white px-3.5 py-3 md:flex-row md:items-center md:px-4"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Pulse className="h-4 w-3/4" />
                  <Pulse className="h-3 w-1/3" />
                </div>
                <div className="flex items-center gap-2">
                  <Pulse className="h-11 w-28 rounded-lg" />
                  <Pulse className="rounded-xl size-11" />
                  <Pulse className="rounded-xl size-11" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <span className="sr-only">Carregando detalhes do projeto…</span>
      </main>
    </div>
  )
}
