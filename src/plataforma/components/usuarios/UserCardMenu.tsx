import { Menu } from '@base-ui/react/menu'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { Profile } from '@/shared/types/profile'

interface Props {
  profile: Profile
  onEdit: (profile: Profile) => void
  onSuspend: (profile: Profile) => void
  onRemove: (profile: Profile) => void
}

const itemClass = cn(
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 outline-none',
  'hover:bg-industrial-50 focus:bg-industrial-50'
)

export function UserCardMenu({ profile, onEdit, onSuspend, onRemove }: Props) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="border-industrial-200 text-industrial-600 hover:bg-industrial-50 focus-visible:ring-industrial-400 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-white transition focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Opções de ${profile.fullName}`}
      >
        <Icon name="more_vert" className="text-[20px]" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4}>
          <Menu.Popup className="bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 min-w-55 overflow-hidden rounded-lg py-1 text-sm shadow-md ring-1">
            <Menu.Item onClick={() => onEdit(profile)} className={itemClass}>
              <Icon name="edit" className="text-industrial-600 text-[18px]" />
              Editar usuário
            </Menu.Item>
            <Menu.Item onClick={() => onSuspend(profile)} className={itemClass}>
              <Icon name="block" className="text-industrial-600 text-[18px]" />
              Suspender acesso
            </Menu.Item>
            <Menu.Item
              onClick={() => onRemove(profile)}
              className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 flex w-full cursor-pointer items-center gap-2 px-3 py-2 outline-none"
            >
              <Icon name="delete" className="text-[18px]" />
              Remover usuário
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
