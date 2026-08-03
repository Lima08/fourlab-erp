import type { ProductionFunnelCounts } from '@/app/dashboard/utils/dashboardAggregates'

interface ProductionFunnelSectionProps {
  production: ProductionFunnelCounts
}

const STAGES: Array<{ key: keyof Omit<ProductionFunnelCounts, 'scrap'>; label: string }> = [
  { key: 'waiting', label: 'Aguardando' },
  { key: 'inProduction', label: 'Em produção' },
  { key: 'assembly', label: 'Montagem' },
  { key: 'completed', label: 'Concluído' },
]

export function ProductionFunnelSection({ production }: ProductionFunnelSectionProps) {
  const totalActive =
    production.waiting + production.inProduction + production.assembly + production.completed

  return (
    <section className="border-industrial-200 space-y-4 rounded-xl border bg-white p-4">
      <div>
        <h2 className="text-industrial-900 text-lg font-bold">Produção</h2>
        <p className="text-industrial-500 text-sm">Ordens por etapa (agora)</p>
      </div>

      {totalActive === 0 ? (
        <p className="text-industrial-500 text-sm">Nenhuma ordem de produção em aberto.</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGES.map((stage) => (
          <div key={stage.key} className="bg-industrial-50 rounded-lg px-3 py-2">
            <p className="text-industrial-500 text-xs font-semibold tracking-wide uppercase">
              {stage.label}
            </p>
            <p className="text-industrial-900 text-xl font-extrabold">{production[stage.key]}</p>
          </div>
        ))}
      </div>

      {production.scrap > 0 ? (
        <p className="text-industrial-500 text-xs">
          Sucata: <span className="text-industrial-800 font-semibold">{production.scrap}</span>
        </p>
      ) : null}
    </section>
  )
}
