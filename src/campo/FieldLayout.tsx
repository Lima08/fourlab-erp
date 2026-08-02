import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from '@/campo/components/AppHeader'
import { StorageAlmostFullBanner } from '@/campo/components/StorageAlmostFullBanner'
import { drainQueue } from '@/shared/services/sync/syncService'

export interface FieldLayoutContext {
  setHideHeader: (value: boolean) => void
}

export default function FieldLayout() {
  const [hideHeader, setHideHeader] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const runDrain = () => {
      drainQueue().catch(console.error)
    }

    if (navigator.onLine) {
      runDrain()
    }

    window.addEventListener('online', runDrain)
    return () => window.removeEventListener('online', runDrain)
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <AppHeader hidden={hideHeader} />
      <main className={hideHeader ? '' : 'space-y-4 p-4'}>
        {!hideHeader && <StorageAlmostFullBanner />}
        <div key={location.pathname} className="animate-fade-slide-in">
          <Outlet context={{ setHideHeader } satisfies FieldLayoutContext} />
        </div>
      </main>
    </div>
  )
}
