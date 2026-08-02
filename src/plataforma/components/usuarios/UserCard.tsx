import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, STATUS_LABELS } from '@/plataforma/constants/userLabels'
import type { Profile, ProfileRole, ProfileStatus } from '@/shared/types/profile'
import { UserCardMenu } from './UserCardMenu'

const STATUS_RAIL: Record<ProfileStatus, string> = {
  ativo: 'bg-emerald-500',
  convite_pendente: 'bg-amber-500',
  suspenso: 'bg-red-500',
}

const ROLE_BADGE: Record<ProfileRole, { className: string; icon: string }> = {
  admin: { className: 'bg-blue-50 text-blue-700', icon: 'admin_panel_settings' },
  cliente: { className: 'bg-industrial-100 text-industrial-700', icon: 'person' },
}

const STATUS_BADGE: Record<ProfileStatus, { className: string; icon: string }> = {
  ativo: { className: 'bg-emerald-50 text-emerald-700', icon: 'check_circle' },
  convite_pendente: {
    className: 'border border-amber-200 bg-amber-50 text-amber-800',
    icon: 'schedule',
  },
  suspenso: { className: 'bg-red-50 text-red-700', icon: 'block' },
}

const AVATAR: Record<ProfileRole, string> = {
  admin: 'bg-blue-50 text-blue-700',
  cliente: 'bg-industrial-100 text-industrial-900',
}

const STATUS_FOOTER_ICON: Record<ProfileStatus, string> = {
  ativo: 'check_circle',
  convite_pendente: 'schedule',
  suspenso: 'block',
}

function getInitials(name: string): string {
  if (!name.trim()) return '-'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('')
}

function displayField(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

interface Props {
  profile: Profile
  isLastAdmin: boolean
  onEdit: (profile: Profile) => void
  onSuspend: (profile: Profile) => void
  onRemove: (profile: Profile) => void
  onManageAccess: (profile: Profile) => void
  onResendInvite: (profile: Profile) => void
}

export function UserCard({
  profile,
  isLastAdmin,
  onEdit,
  onSuspend,
  onRemove,
  onManageAccess,
  onResendInvite,
}: Props) {
  const isPending = profile.status === 'convite_pendente'
  const roleBadge = ROLE_BADGE[profile.role]
  const statusBadge = STATUS_BADGE[profile.status]

  return (
    <article
      className="border-industrial-200 relative overflow-hidden rounded-xl border bg-white shadow-sm"
      data-last-admin={isLastAdmin || undefined}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', STATUS_RAIL[profile.status])} />

      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                roleBadge.className
              )}
            >
              <Icon name={roleBadge.icon} className="text-[14px]" />
              {ROLE_LABELS[profile.role]}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                statusBadge.className
              )}
            >
              <Icon name={statusBadge.icon} className="text-[14px]" />
              {STATUS_LABELS[profile.status]}
            </span>
          </div>
          <UserCardMenu
            profile={profile}
            onEdit={onEdit}
            onSuspend={onSuspend}
            onRemove={onRemove}
          />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div
            className={cn(
              'flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-100 text-[22px] font-extrabold text-slate-600',
              AVATAR[profile.role]
            )}
          >
            {getInitials(profile.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-industrial-950 truncate text-[22px] leading-tight font-extrabold tracking-tight md:text-2xl">
              {displayField(profile.fullName)}
            </h2>
            <p className="text-[16px] font-medium text-slate-500">{ROLE_LABELS[profile.role]}</p>
            <div className="text-industrial-600 mt-2 flex items-center gap-1.5 text-sm">
              <Icon name="mail" className="text-industrial-500 text-[16px]" />
              <span className="truncate">{displayField(profile.email)}</span>
            </div>
            <div className="text-industrial-600 mt-1 flex items-center gap-1.5 text-sm">
              <Icon name="phone" className="text-industrial-500 text-[16px]" />
              <span className="truncate">{displayField(profile.phone)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-industrial-200 flex items-center justify-between gap-3 border-t px-5 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-1.5 text-[13.5px] font-bold text-slate-400">
          <Icon name={STATUS_FOOTER_ICON[profile.status]} className="text-[16px]" />
          {STATUS_LABELS[profile.status]}
        </div>

        {isPending ? (
          <Button
            type="button"
            variant="outline"
            className="border-industrial-950 text-industrial-950 hover:bg-industrial-50 h-13 shrink-0 gap-2 rounded-xl border-2 bg-white px-5 text-[16px] font-semibold"
            onClick={() => onResendInvite(profile)}
          >
            <Icon name="cloud_upload" className="text-[18px]" />
            Reenviar convite
          </Button>
        ) : (
          <Button
            type="button" //ml-auto h-13 px-5 rounded-xl font-extrabold text-[16px] flex items-center justify-center gap-2 transition active:scale-[0.98] bg-ink text-white hover:bg-slate-800 shadow-sm
            className="bg-industrial-950 hover:bg-industrial-800 h-13 shrink-0 gap-2 rounded-xl px-5 text-[16px] font-semibold text-white"
            onClick={() => onManageAccess(profile)}
          >
            <Icon name="admin_panel_settings" className="text-[18px]" />
            Gerenciar acesso
          </Button>
        )}
      </div>
    </article>
  )
}
