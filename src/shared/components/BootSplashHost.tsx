import type { ReactNode } from 'react'
import { BootSplash } from '@/shared/components/BootSplash'
import { BootSplashContext } from '@/shared/components/bootSplashContext'
import { useBootSplashController } from '@/shared/hooks/useBootSplashController'

interface Props {
  children: ReactNode
}

/** Overlay de boot com brand moment; cobre o app até auth ready + mínimo anti-flicker. */
export function BootSplashHost({ children }: Props) {
  const { show, fading, logoLanded } = useBootSplashController()

  return (
    <BootSplashContext.Provider value={{ show, fading, logoLanded }}>
      {children}
      {show ? <BootSplash fading={fading} logoLanded={logoLanded} animate pulse={!fading} /> : null}
    </BootSplashContext.Provider>
  )
}
