import { isUserManagementEnabled } from "../config/features"

export interface PlatformNavItem {
  icon: string
  label: string
  to: string
  isActive: (pathname: string) => boolean
}

export const PLATFORM_NAV: PlatformNavItem[] = [
  {
    icon: 'grid_view',
    label: 'Dashboard',
    to: '/plataforma',
    isActive: (pathname) => pathname === '/plataforma' || pathname === '/plataforma/',
  },
  {
    icon: 'folder',
    label: 'Administração de projetos',
    to: '/campo',
    isActive: (pathname) => pathname.startsWith('/campo'),
  },
  {
    icon: 'group',
    label: 'Administração de usuários',
    to: '/plataforma/usuarios',
    isActive: (pathname) => pathname.startsWith('/plataforma/usuarios'),
  },
]

export function getPlatformNavItems(): PlatformNavItem[] {
  if (!isUserManagementEnabled()) {
    return PLATFORM_NAV.filter((item) => item.to !== '/plataforma/usuarios')
  }
  return PLATFORM_NAV
}
