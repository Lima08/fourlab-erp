import { useDashboard } from '@/app/dashboard/hooks/useDashboard'
import { usePullToRefresh } from '@/app/dashboard/hooks/usePullToRefresh'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import { DashboardHeader } from '@/app/dashboard/components/DashboardHeader'
import { DashboardOfflineBanner } from '@/app/dashboard/components/DashboardOfflineBanner'
import { DashboardErrorState } from '@/app/dashboard/components/DashboardErrorState'
import { FinancialPulseSection } from '@/app/dashboard/components/FinancialPulseSection'
import { SalesSection } from '@/app/dashboard/components/SalesSection'
import { ProductionFunnelSection } from '@/app/dashboard/components/ProductionFunnelSection'
import { LatestApprovedSection } from '@/app/dashboard/components/LatestApprovedSection'

export default function HomePage() {
  const { data, isLoading, isError, isFetching, refetch } = useDashboard()
  const { isOnline } = useConnectivity()
  const containerRef = usePullToRefresh<HTMLDivElement>({
    onRefresh: () => refetch(),
    disabled: isLoading || isFetching,
  })

  return (
    <div ref={containerRef} className="space-y-4">
      <DashboardHeader
        monthLabel={data?.monthLabel ?? '…'}
        onRefresh={() => {
          void refetch()
        }}
        isRefreshing={isFetching}
      />

      {!isOnline ? <DashboardOfflineBanner /> : null}

      {isLoading && !data ? (
        <p className="text-industrial-500 text-sm">Carregando dashboard…</p>
      ) : null}

      {isError && !data ? <DashboardErrorState onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <FinancialPulseSection financial={data.financial} />

          <div className="grid gap-4 md:grid-cols-2">
            <SalesSection monthTotal={data.salesMonthTotal} evolution={data.salesEvolution} />
            <ProductionFunnelSection production={data.production} />
          </div>

          <LatestApprovedSection items={data.latestApproved} />
        </>
      ) : null}
    </div>
  )
}
