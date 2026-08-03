import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { navItems } from '@/app/navigation/navItems'

export function AppBottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="border-industrial-200 fixed inset-x-0 bottom-0 z-40 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-7xl">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors',
                isActive ? 'text-industrial-950' : 'text-industrial-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} fill={isActive} className="text-[22px]" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
