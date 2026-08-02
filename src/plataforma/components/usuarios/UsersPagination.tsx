import { Pagination } from '@/components/ui/pagination'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function UsersPagination({ page, totalPages, onPageChange }: Props) {
  return (
    <div className="mt-8">
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
