import { formatCurrency } from '@/shared/utils/formatCurrency'
import type { MoneyPulse } from '@/app/dashboard/utils/dashboardAggregates'

interface FinancialPulseSectionProps {
  financial: MoneyPulse
}

export function FinancialPulseSection({ financial }: FinancialPulseSectionProps) {
  const isEmpty =
    financial.received === 0 &&
    financial.paid === 0 &&
    financial.overdueCount === 0

  return (
    <section className="border-industrial-200 space-y-4 rounded-xl border bg-white p-4">
      <div>
        <h2 className="text-industrial-900 text-lg font-bold">Financeiro do mês</h2>
        <p className="text-industrial-500 text-sm">Caixa (regime de pagamento)</p>
      </div>

      {isEmpty ? (
        <p className="text-industrial-500 text-sm">Nenhum movimento financeiro neste mês.</p>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-industrial-500 text-xs font-semibold tracking-wide uppercase">
            Recebido
          </p>
          <p className="text-industrial-900 text-base font-bold sm:text-lg">
            {formatCurrency(financial.received)}
          </p>
        </div>
        <div>
          <p className="text-industrial-500 text-xs font-semibold tracking-wide uppercase">Pago</p>
          <p className="text-industrial-900 text-base font-bold sm:text-lg">
            {formatCurrency(financial.paid)}
          </p>
        </div>
        <div>
          <p className="text-industrial-500 text-xs font-semibold tracking-wide uppercase">
            Saldo
          </p>
          <p className="text-industrial-900 text-base font-bold sm:text-lg">
            {formatCurrency(financial.balance)}
          </p>
        </div>
      </div>

      {financial.overdueCount > 0 ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="status"
        >
          <span className="font-semibold">Atrasados:</span> {financial.overdueCount} título
          {financial.overdueCount === 1 ? '' : 's'} · {formatCurrency(financial.overdueAmount)}
        </div>
      ) : null}
    </section>
  )
}
