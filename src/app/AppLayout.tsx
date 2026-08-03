import { Outlet } from 'react-router-dom'
import { UserMenu } from '@/shared/components/UserMenu'
import { AppSidebar } from '@/app/components/AppSidebar'
import { AppBottomNav } from '@/app/components/AppBottomNav'

export default function AppLayout() {
  return (
    <div className="bg-industrial-50 flex min-h-screen flex-col">
      <header className="border-industrial-200 sticky top-0 z-40 border-b bg-white">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
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
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 px-4 py-8 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <AppBottomNav />
    </div>
  )
}
