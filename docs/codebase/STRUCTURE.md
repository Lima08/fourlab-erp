# Structure — Fourlab ERP

**Root:** `/home/lima-nav/Documents/development/fourlabs/fourlab-app`

```
fourlab-erp/
├── public/                    # Favicons, PWA icons, SPA headers
├── src/
│   ├── app/                   # Shell autenticado + domínio
│   │   ├── AppGuard.tsx
│   │   ├── AppLayout.tsx
│   │   ├── components/        # AppHeaderNav, AppBottomNav
│   │   ├── pages/HomePage.tsx
│   │   └── customers/         # Módulo Clientes
│   │       ├── components/
│   │       ├── constants.ts
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── schemas/
│   ├── auth/                  # Login + password flows
│   ├── components/ui/         # Design system
│   ├── shared/
│   │   ├── components/        # BootSplash, UserMenu, NotFound
│   │   ├── config/            # Feature flags
│   │   ├── constants/
│   │   ├── db/                # supabase.ts, database.types.ts
│   │   ├── hooks/             # auth, connectivity, profile, usePostalCode
│   │   ├── navigation/        # RootRedirect, getAuthHomePath
│   │   ├── providers/
│   │   ├── services/          # profile*, customerService
│   │   ├── stores/authStore.ts
│   │   ├── types/
│   │   └── utils/             # brazilianDocuments, fetchAddressByCep, …
│   ├── lib/utils.ts
│   ├── main.tsx
│   ├── router.tsx
│   └── test/setup.ts
├── supabase/                  # migrations, seed, functions
├── docs/codebase/
├── package.json               # name: fourlab-erp
├── vite.config.ts
└── wrangler.jsonc             # Cloudflare Workers: fourlab-erp
```

## Onde achar

| Precisa de… | Onde |
| --- | --- |
| Rotas | `src/router.tsx` |
| Guard auth | `src/app/AppGuard.tsx` |
| Nav módulos (mobile/desktop) | `src/app/components/AppBottomNav.tsx`, `AppHeaderNav.tsx` |
| Client Supabase | `src/shared/db/supabase.ts` |
| Tipos DB | `src/shared/db/database.types.ts` |
| Login | `src/auth/LoginPage.tsx` |
| Home pós-login | `src/app/pages/HomePage.tsx` |
| Clientes (listagem/form/ficha) | `src/app/customers/` |
| Service clientes | `src/shared/services/customerService.ts` |
| Edge invite/update | `supabase/functions/` |
