import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { BootSplash } from '@/shared/components/BootSplash'
import { lazyWithRetry } from '@/shared/utils/lazyWithRetry'
import RootRedirect from '@/shared/navigation/RootRedirect'
import DashboardPage from './plataforma/pages/DashboardPage'
import FieldGuard from '@/campo/FieldGuard'
import FieldLayout from '@/campo/FieldLayout'
import PlatformPlaceholderPage from '@/plataforma/components/PlatformPlaceholderPage'
import NotFound from './shared/components/NotFound'

const ProjectsPage = lazyWithRetry(() => import('@/campo/pages/ProjectsPage'))
const InspectionPage = lazyWithRetry(() => import('@/campo/pages/InspectionPage'))
const InspectionSummaryPage = lazyWithRetry(() => import('@/campo/pages/InspectionSummaryPage'))
const LocationPage = lazyWithRetry(() => import('@/campo/pages/LocationPage'))
const PreferencesPage = lazyWithRetry(() => import('@/campo/pages/PreferencesPage'))
const MyAccountPage = lazyWithRetry(() => import('@/campo/pages/MyAccountPage'))
const LoginPage = lazyWithRetry(() => import('@/auth/LoginPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('@/auth/ForgotPasswordPage'))
const ActivateAccountPage = lazyWithRetry(() => import('@/auth/ActivateAccountPage'))
const ResetPasswordPage = lazyWithRetry(() => import('@/auth/ResetPasswordPage'))
const PlatformGuard = lazyWithRetry(() => import('@/plataforma/PlatformGuard'))
const PlatformLayout = lazyWithRetry(() => import('@/plataforma/PlatformLayout'))
const UsersPage = lazyWithRetry(() => import('@/plataforma/pages/UsersPage'))

const suspend = (element: React.ReactNode) => (
  <Suspense fallback={<BootSplash />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <FieldGuard />,
    children: [
      {
        path: '/campo',
        element: <FieldLayout />,
        children: [
          { index: true, element: suspend(<ProjectsPage />) },
          { path: 'vistoria/:projectId', element: suspend(<InspectionPage />) },
          { path: 'vistoria/:projectId/local/:locationId', element: suspend(<LocationPage />) },
          { path: 'vistoria/:projectId/resumo', element: suspend(<InspectionSummaryPage />) },
          { path: 'preferencias', element: suspend(<PreferencesPage />) },
          { path: 'minha-conta', element: suspend(<MyAccountPage />) },
        ],
      },
    ],
  },
  {
    element: suspend(<PlatformGuard />),
    children: [
      {
        path: '/plataforma',
        element: suspend(<PlatformLayout />),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'projetos',
            element: <PlatformPlaceholderPage title="Administração de projetos" />,
          },
          {
            path: 'usuarios',
            element: suspend(<UsersPage />),
          },
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
