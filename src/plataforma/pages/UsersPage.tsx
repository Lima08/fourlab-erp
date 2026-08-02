import { AddUserModal } from '@/plataforma/components/usuarios/AddUserModal'
import { ConfirmRemoveDialog } from '@/plataforma/components/usuarios/ConfirmRemoveDialog'
import { ConfirmSuspendDialog } from '@/plataforma/components/usuarios/ConfirmSuspendDialog'
import { EditUserModal } from '@/plataforma/components/usuarios/EditUserModal'
import { ManageAccessModal } from '@/plataforma/components/usuarios/ManageAccessModal'
import { UsersEmptyState } from '@/plataforma/components/usuarios/UsersEmptyState'
import { UsersFilterPills } from '@/plataforma/components/usuarios/UsersFilterPills'
import { UsersGrid } from '@/plataforma/components/usuarios/UsersGrid'
import { UsersOfflineBanner } from '@/plataforma/components/usuarios/UsersOfflineBanner'
import { UsersOfflineState } from '@/plataforma/components/usuarios/UsersOfflineState'
import { UsersPageHeader } from '@/plataforma/components/usuarios/UsersPageHeader'
import { UsersPagination } from '@/plataforma/components/usuarios/UsersPagination'
import { UsersSearchBar } from '@/plataforma/components/usuarios/UsersSearchBar'
import { useProfileCounts } from '@/plataforma/hooks/useProfileCounts'
import { useProfileMutations } from '@/plataforma/hooks/useProfileMutations'
import { useProfilesList } from '@/plataforma/hooks/useProfilesList'
import { useUsersPageState } from '@/plataforma/hooks/useUsersPageState'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import type { Profile } from '@/shared/types/profile'

const PAGE_SIZE = 10

export default function UsersPage() {
  const { isOnline } = useConnectivity()
  const {
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    resetFilters,
    searchBarKey,
    selectedProfile,
    modal,
    openModal,
    closeModal,
  } = useUsersPageState()

  const { resend, updateStatus, remove, isUpdatingStatus, isRemoving } = useProfileMutations()

  const listParams = { filter, search, page, pageSize: PAGE_SIZE }
  const { data: listData, isLoading: isListLoading } = useProfilesList(listParams, isOnline)
  const { data: counts } = useProfileCounts(isOnline)

  const profiles = listData?.profiles ?? []
  const totalPages = listData?.totalPages ?? 1
  const adminCount = counts?.admin ?? 0
  const showEmptyState = isOnline && !isListLoading && listData != null && profiles.length === 0
  const showGrid = isOnline && profiles.length > 0

  const handleEdit = (profile: Profile) => openModal('edit', profile)
  const handleSuspend = (profile: Profile) => openModal('suspend', profile)
  const handleRemove = (profile: Profile) => openModal('remove', profile)
  const handleManageAccess = (profile: Profile) => openModal('manageAccess', profile)

  const handleResendInvite = async (profile: Profile) => {
    try {
      await resend(profile.id)
    } catch {
      // toast handled in mutation hook
    }
  }

  const handleConfirmSuspend = async () => {
    if (!selectedProfile) return

    try {
      await updateStatus({ id: selectedProfile.id, status: 'suspenso' })
      closeModal()
    } catch {
      // toast handled in mutation hook
    }
  }

  const handleConfirmRemove = async () => {
    if (!selectedProfile) return

    const wasLastOnPage = profiles.length === 1

    try {
      await remove(selectedProfile.id)
      closeModal()
      if (wasLastOnPage && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      }
    } catch {
      // toast handled in mutation hook
    }
  }

  return (
    <div className="space-y-6">
      <UsersPageHeader
        counts={counts}
        isOffline={!isOnline}
        onAddClick={() => openModal('add')}
      />

      {!isOnline && <UsersOfflineBanner />}

      <UsersSearchBar key={searchBarKey} onSearchChange={setSearch} />

      <UsersFilterPills
        activeFilter={filter}
        counts={counts}
        isOffline={!isOnline}
        onFilterChange={setFilter}
      />

      {!isOnline && <UsersOfflineState />}

      {showEmptyState && <UsersEmptyState onClearFilters={resetFilters} />}

      {showGrid && (
        <>
          <UsersGrid
            profiles={profiles}
            adminCount={adminCount}
            onEdit={handleEdit}
            onSuspend={handleSuspend}
            onRemove={handleRemove}
            onManageAccess={handleManageAccess}
            onResendInvite={handleResendInvite}
          />
          <UsersPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <AddUserModal open={modal === 'add'} onClose={closeModal} />

      <EditUserModal
        open={modal === 'edit'}
        profile={selectedProfile}
        adminCount={adminCount}
        onClose={closeModal}
      />

      <ManageAccessModal
        open={modal === 'manageAccess'}
        profile={selectedProfile}
        onClose={closeModal}
      />

      <ConfirmSuspendDialog
        open={modal === 'suspend'}
        profile={selectedProfile}
        onConfirm={handleConfirmSuspend}
        onCancel={closeModal}
        isPending={isUpdatingStatus}
      />

      <ConfirmRemoveDialog
        open={modal === 'remove'}
        profile={selectedProfile}
        onConfirm={handleConfirmRemove}
        onCancel={closeModal}
        isPending={isRemoving}
      />
    </div>
  )
}
