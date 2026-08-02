import logo from '@/assets/logo.png'
import { ConnectivityBadge } from '@/campo/components/projetos/ConnectivityBadge'
import { UserMenu } from '@/shared/components/UserMenu'

export function PlatformHeader() {
  return (
    <header className="border-industrial-200 sticky top-0 z-40 border-b-2 bg-white">
      <div className="mx-auto flex h-18 max-w-320 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 leading-tight">
            <div className="text-industrial-400 text-[11px] font-extrabold tracking-[0.14em] uppercase">
              Vistoria Técnica
            </div>
            <div className="text-industrial-950 truncate text-[17px] font-extrabold">
              Plataforma
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ConnectivityBadge />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
