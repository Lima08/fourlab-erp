import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import QueryProvider from '@/shared/providers/QueryProvider'
import AuthProvider from '@/shared/providers/AuthProvider'
import { BootSplashHost } from '@/shared/components/BootSplashHost'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BootSplashHost>
          <RouterProvider router={router} />
          <Toaster />
        </BootSplashHost>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
)
