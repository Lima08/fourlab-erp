import { useConnectivity } from '@/shared/hooks/useConnectivity'
import { DashboardPageHeader } from '../components/dashboard/DashboardPageHeader'
import { useProjects } from '@/campo/hooks/useProjects'
import { useState } from 'react'
import { AddProjectModal } from '../components/dashboard/AddProjectModal'
import { DashboardCardList } from '../components/dashboard/DashboardCardList'

export default function DashboardPage() {
  const { isOnline } = useConnectivity()
  const { counts } = useProjects()
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <div className="space-y-6">
      <DashboardPageHeader isOffline={!isOnline} onOpenModal={() => setIsModalOpen(true)} />
      <AddProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <DashboardCardList counts={counts} />
    </div>
  )
}
