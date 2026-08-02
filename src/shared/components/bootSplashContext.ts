import { createContext, useContext } from 'react'

export interface BootSplashContextValue {
  /** Splash ainda montado (visível ou fading). */
  show: boolean
  /** Morph/fade de saída em andamento. */
  fading: boolean
  /** Logo do splash chegou ao slot — revelar logo do login por baixo. */
  logoLanded: boolean
}

export const BootSplashContext = createContext<BootSplashContextValue>({
  show: false,
  fading: false,
  logoLanded: false,
})

export function useBootSplashState(): BootSplashContextValue {
  return useContext(BootSplashContext)
}
