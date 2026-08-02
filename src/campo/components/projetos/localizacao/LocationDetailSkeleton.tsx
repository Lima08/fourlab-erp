import { LocationDetailTopBar } from './LocationDetailTopBar'

interface Props {
  onBack: () => void
}

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-industrial-200 ${className}`} />
}

/**
 * Espelha LocationPage (info + lista de itens) para evitar layout shift.
 */
export function LocationDetailSkeleton({ onBack }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-industrial-50">
      <LocationDetailTopBar onBack={onBack} />

      <main
        className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-12 md:p-8"
        role="status"
        aria-live="polite"
        aria-label="Carregando localização"
      >
        <section className="overflow-hidden rounded-xl border border-industrial-200 bg-white shadow-sm">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Pulse className="rounded-xl size-12" />
                <div className="space-y-2">
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-6 w-48 max-w-full" />
                </div>
              </div>
              <Pulse className="h-7 w-28 rounded-full" />
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Pulse className="h-3 w-32" />
                <Pulse className="h-3 w-16" />
              </div>
              <Pulse className="h-2 w-full rounded-full" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Pulse className="h-5 w-40" />
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-industrial-100 bg-white p-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Pulse className="h-4 w-3/4" />
                <Pulse className="h-3 w-1/4" />
              </div>
              <Pulse className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </section>

        <span className="sr-only">Carregando localização…</span>
      </main>
    </div>
  )
}
