import { Outlet } from 'react-router-dom'
import { PlatformHeader } from '@/plataforma/components/PlatformHeader'

export default function PlatformLayout() {
  return (
    <div className="bg-background min-h-screen">
      <PlatformHeader />
      <main className="mx-auto max-w-320 px-4 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
