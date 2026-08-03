import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CustomerListHeader } from '@/app/customers/components/CustomerListHeader'
import { CustomerFilters } from '@/app/customers/components/CustomerFilters'
import { CustomerList } from '@/app/customers/components/CustomerList'
import { CustomerEmptyState } from '@/app/customers/components/CustomerEmptyState'
import { useCustomers } from '@/app/customers/hooks/useCustomers'
import { useCustomerCounts } from '@/app/customers/hooks/useCustomerCounts'
import type { CustomerStatusFilterId } from '@/app/customers/constants'
import { Pagination } from '@/components/ui/pagination'
import { Icon } from '@/components/ui/icon'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilterId>('active')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const { customers, totalPages, isLoading, isError } = useCustomers({
    page,
    statusFilter,
    search,
  })
  const { counts } = useCustomerCounts(search)

  function handleFilterChange(filter: CustomerStatusFilterId) {
    setStatusFilter(filter)
    setPage(1)
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <CustomerListHeader />

      <form onSubmit={handleSearchSubmit} className="relative">
        <Icon
          name="search"
          className="text-industrial-400 absolute top-1/2 left-3 -translate-y-1/2 text-[20px]"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome, documento, e-mail ou telefone"
          className="border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 h-12 w-full rounded-lg border-2 bg-white py-2 pr-3 pl-10 text-base focus:outline-none"
        />
      </form>

      <CustomerFilters
        activeFilter={statusFilter}
        counts={counts}
        onFilterChange={handleFilterChange}
      />

      {isLoading ? (
        <p className="text-industrial-500 text-sm">Carregando clientes…</p>
      ) : isError ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          Não foi possível carregar os clientes. Tente novamente.
        </p>
      ) : customers.length === 0 ? (
        <CustomerEmptyState hasSearch={search.length > 0 || statusFilter !== 'active'} />
      ) : (
        <>
          <CustomerList customers={customers} onSelect={(id) => navigate(`/clientes/${id}`)} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
