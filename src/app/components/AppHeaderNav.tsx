import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/inicio', label: 'Início', icon: 'home' },
  { to: '/clientes', label: 'Clientes', icon: 'groups' },
] as const

export function AppHeaderNav() {
  return (
    <nav aria-label="Módulos" className="hidden items-center gap-1 md:flex">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-industrial-950 text-white'
                : 'text-industrial-600 hover:bg-industrial-100 hover:text-industrial-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} fill={isActive} className="text-[18px]" />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
