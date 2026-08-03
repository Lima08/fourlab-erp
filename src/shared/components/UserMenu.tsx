import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'
import { useCurrentProfile } from '@/shared/hooks/useCurrentProfile'
import { supabase } from '@/shared/db/supabase'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('')
}

function getShortName(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length < 2) return parts[0] ?? ''
  const last = parts[parts.length - 1]
  return `${parts[0]} ${last?.[0] ?? ''}.`
}

function MenuDivider() {
  return <div className="border-industrial-100 mx-4 border-t" />
}

function MenuSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-industrial-400 px-5 pt-3 pb-1 text-[11px] font-extrabold tracking-[0.12em] uppercase">
      {children}
    </div>
  )
}

interface MenuItemProps {
  icon: string
  label: string
  onClick: () => void
  destructive?: boolean
}

function MenuItem({ icon, label, onClick, destructive }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold transition-colors',
        !destructive && 'text-industrial-950 hover:bg-industrial-50',
        destructive && 'font-extrabold text-red-700 hover:bg-red-50'
      )}
    >
      <Icon
        name={icon}
        className={cn('shrink-0 text-[20px]', destructive ? 'text-red-700' : 'text-industrial-700')}
      />
      <span className="flex-1">{label}</span>
    </button>
  )
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { profile } = useCurrentProfile()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const fullName = profile?.fullName ?? (user?.user_metadata?.full_name as string | undefined)
  const email = user?.email ?? ''
  const displayName = fullName ?? email.split('@')[0] ?? 'Usuário'
  const initials = fullName ? getInitials(fullName) : displayName.slice(0, 2).toUpperCase()
  const shortName = fullName ? getShortName(fullName) : displayName

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="bg-industrial-950 hover:bg-industrial-800 flex h-11 items-center gap-2 rounded-full pr-3 pl-1.5 font-bold text-white transition active:scale-95"
      >
        <span className="bg-industrial-700 flex size-8 items-center justify-center rounded-full text-[13px] font-extrabold">
          {initials}
        </span>
        <span className="hidden text-[14px] whitespace-nowrap md:inline">{shortName}</span>
        <Icon name="expand_more" className="text-[20px]" />
      </button>

      {open && (
        <div
          role="menu"
          className="border-industrial-200 absolute top-[calc(100%+8px)] right-0 z-50 w-75 overflow-hidden rounded-xl border bg-white shadow-[0_4px_24px_rgba(15,23,42,0.1)]"
        >
          <div className="px-5 py-4">
            <div className="text-industrial-950 text-[16px] font-extrabold">{displayName}</div>
            {email && <div className="text-industrial-500 text-[13px] font-medium">{email}</div>}
          </div>

          <MenuDivider />
          <MenuSectionLabel>Conta</MenuSectionLabel>
          <div className="py-1 pb-2">
            <MenuItem icon="logout" label="Sair da conta" destructive onClick={handleLogout} />
          </div>
        </div>
      )}
    </div>
  )
}
