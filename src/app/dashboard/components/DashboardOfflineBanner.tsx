export function DashboardOfflineBanner() {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      role="status"
    >
      Sem conexão. Exibindo dados em memória, se houver.
    </div>
  )
}
