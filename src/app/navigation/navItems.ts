export const navItems = [
  { to: '/inicio', label: 'Início', icon: 'home' },
  { to: '/clientes', label: 'Clientes', icon: 'groups' },
] as const

export type NavItem = (typeof navItems)[number]
