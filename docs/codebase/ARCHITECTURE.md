# Architecture — Fourlab ERP

Shell React + Supabase online-first. Módulo **Clientes** implementado; demais domínios (financeiro, estoque, produção) em roadmap.

## Visão geral

```
Browser (PWA)
  └── React app
        ├── auth/          Login + password flows
        ├── app/           Guard + layout + home + customers
        └── shared/
              ├── db/supabase (+ database.types.ts)
              ├── stores/authStore + AuthProvider
              ├── services/profile*, customerService
              └── providers/QueryProvider
                    └── Supabase Auth + Postgres (RLS)
```

## Módulos

### `src/app/`

Shell autenticado: `AppGuard`, `AppLayout` (header + bottom nav mobile), `HomePage`, módulo `customers/`.

**Navegação:** bottom nav `< md`; links equivalentes no header `md+` (`/inicio`, `/clientes`).

### `src/app/customers/`

Domínio Clientes: listagem paginada, formulários PF/PJ, ficha com pedidos read-only, ativar/inativar.

- **Pages:** `CustomersPage`, `CustomerNewPage`, `CustomerDetailPage`, `CustomerEditPage`
- **Hooks:** React Query (`useCustomers`, `useCustomer`, `useCustomerOrders`, `useCustomerMutations`)
- **Schema:** Zod em `schemas/customerFormSchema.ts`
- **I/O:** `shared/services/customerService.ts`

### `src/auth/`

Páginas de login, recuperação, reset e ativação de conta. Usam Supabase Auth + `profiles`.

### `src/shared/`

Infra compartilhada: client Supabase, auth Zustand, React Query, profile/customer services, BootSplash, navegação, utils (`brazilianDocuments`, `fetchAddressByCep`).

### `src/components/ui/`

Design system headless (Base UI + Tailwind + CVA). Sem Supabase, sem store.

## Auth

1. `AuthProvider` hidrata sessão via `supabase.auth.onAuthStateChange`
2. `AppGuard` exige usuário; convite pendente → `/ativar-conta`
3. `RootRedirect` (`/`) → `/inicio` se autenticado, senão `/login`
4. Perfil em `public.profiles` — baseline **sem RBAC** (`is_active` only; sem `role`/`status`)

## Dados

- **Fonte da verdade:** Postgres via Supabase client (anon key + RLS).
- Sem IndexedDB/Dexie nesta base.
- Tipos gerados em `src/shared/db/database.types.ts` (`npm run db:types`).
- `customers` + `orders.customer_id` para histórico read-only na ficha.

## PWA

- `vite-plugin-pwa`, `registerType: 'autoUpdate'`
- Manifest: `Fourlab - ERP`, `start_url: '/'`, `display: standalone`
- Precache de assets estáticos; dados de negócio não vão para o SW

## Admin users

Edge Functions `invite-user` / `update-user` + services em `shared/services/profile*`. UI de administração será reintroduzida nas features ERP.
