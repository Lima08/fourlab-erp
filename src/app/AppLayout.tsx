import { Outlet } from 'react-router-dom'
import { UserMenu } from '@/shared/components/UserMenu'
import { AppHeaderNav } from '@/app/components/AppHeaderNav'
import { AppBottomNav } from '@/app/components/AppBottomNav'

export default function AppLayout() {
  return (
    <div className="bg-industrial-50 min-h-screen">
      <header className="border-industrial-200 sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src="/icons/icon-192.png"
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-lg object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-industrial-900 text-lg font-extrabold tracking-tight">Fourlab</p>
                <p className="text-industrial-500 text-[10px] font-bold tracking-[0.14em] uppercase">
                  ERP · Impressão 3D
                </p>
              </div>
            </div>
            <AppHeaderNav />
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 md:px-8 md:pb-8">
        <Outlet />
      </main>
      <AppBottomNav />
    </div>
  )
}
