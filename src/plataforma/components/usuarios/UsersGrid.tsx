import type { Profile } from '@/shared/types/profile'
import { UserCard } from './UserCard'

interface Props {
  profiles: Profile[]
  adminCount: number
  onEdit: (profile: Profile) => void
  onSuspend: (profile: Profile) => void
  onRemove: (profile: Profile) => void
  onManageAccess: (profile: Profile) => void
  onResendInvite: (profile: Profile) => void
}

export function UsersGrid({
  profiles,
  adminCount,
  onEdit,
  onSuspend,
  onRemove,
  onManageAccess,
  onResendInvite,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {profiles.map((profile) => (
        <UserCard
          key={profile.id}
          profile={profile}
          isLastAdmin={adminCount === 1 && profile.role === 'admin'}
          onEdit={onEdit}
          onSuspend={onSuspend}
          onRemove={onRemove}
          onManageAccess={onManageAccess}
          onResendInvite={onResendInvite}
        />
      ))}
    </div>
  )
}
