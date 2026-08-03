import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { BootSplash } from '@/shared/components/BootSplash'
import { lazyWithRetry } from '@/shared/utils/lazyWithRetry'
import RootRedirect from '@/shared/navigation/RootRedirect'
import NotFound from './shared/components/NotFound'
import AppGuard from '@/app/AppGuard'
import AppLayout from '@/app/AppLayout'

const HomePage = lazyWithRetry(() => import('@/app/pages/HomePage'))
const CustomersPage = lazyWithRetry(() => import('@/app/customers/pages/CustomersPage'))
const CustomerNewPage = lazyWithRetry(() => import('@/app/customers/pages/CustomerNewPage'))
const CustomerDetailPage = lazyWithRetry(() => import('@/app/customers/pages/CustomerDetailPage'))
const CustomerEditPage = lazyWithRetry(() => import('@/app/customers/pages/CustomerEditPage'))
const LoginPage = lazyWithRetry(() => import('@/auth/LoginPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('@/auth/ForgotPasswordPage'))
const ActivateAccountPage = lazyWithRetry(() => import('@/auth/ActivateAccountPage'))
const ResetPasswordPage = lazyWithRetry(() => import('@/auth/ResetPasswordPage'))

const suspend = (element: React.ReactNode) => (
  <Suspense fallback={<BootSplash />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <AppGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/inicio', element: suspend(<HomePage />) },
          { path: '/clientes', element: suspend(<CustomersPage />) },
          { path: '/clientes/novo', element: suspend(<CustomerNewPage />) },
          { path: '/clientes/:id', element: suspend(<CustomerDetailPage />) },
          { path: '/clientes/:id/editar', element: suspend(<CustomerEditPage />) },
        ],
      },
    ],
  },
  { path: '/login', element: suspend(<LoginPage />) },
  { path: '/recuperar-senha', element: suspend(<ForgotPasswordPage />) },
  { path: '/ativar-conta', element: suspend(<ActivateAccountPage />) },
  { path: '/reset-senha', element: suspend(<ResetPasswordPage />) },
  { path: '*', element: suspend(<NotFound />) },
])
