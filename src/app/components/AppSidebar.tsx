import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { navItems } from '@/app/navigation/navItems'

const STORAGE_KEY = 'fourlab.sidebar.collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore quota / private mode
  }
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      writeCollapsed(next)
      return next
    })
  }

  return (
    <aside
      className={cn(
        'border-industrial-200 hidden shrink-0 flex-col border-r bg-white md:flex',
        collapsed ? 'w-18' : 'w-56'
      )}
      aria-label="Módulos"
    >
      <div
        className={cn(
          'border-industrial-100 flex h-12 items-center border-b px-2',
          collapsed ? 'justify-center' : 'justify-end'
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="text-industrial-600 hover:bg-industrial-100 hover:text-industrial-900 inline-flex size-9 items-center justify-center rounded-lg transition-colors"
        >
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} className="text-[22px]" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-industrial-950 text-white'
                  : 'text-industrial-600 hover:bg-industrial-100 hover:text-industrial-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} fill={isActive} className="text-[20px]" />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && <span className="sr-only">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
