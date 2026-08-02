# Project Structure

**Root:** `/home/lima-nav/Documents/development/Soraia-bombeiro/soraia-app`

## Directory Tree

```
soraia-app/
├── .specs/                    # SDD workflow docs
│   └── codebase/              # Brownfield analysis
├── src/
│   ├── assets/                # Static assets (imagens, ícones)
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── campo/                 # Módulo principal — app de vistoria
│   │   ├── FieldGuard.tsx     # Auth guard (redireciona para /login)
│   │   ├── FieldLayout.tsx    # Layout com header + outlet
│   │   ├── components/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── SyncStatusBadge.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── projetos/
│   │   │       ├── ProjectCard.tsx
│   │   │       ├── ProjectList.tsx
│   │   │       ├── ProjectStatusBadges.tsx
│   │   │       ├── ...
│   │   │       ├── detalhes/  # Detalhe do projeto (vistoria)
│   │   │       │   ├── ItemsListSection.tsx
│   │   │       │   ├── LocationsRail.tsx
│   │   │       │   ├── ProjectInspectionStatus.tsx
│   │   │       │   └── ...
│   │   │       └── localizacao/  # Detalhe de localização
│   │   │           ├── ItemEditModal.tsx
│   │   │           ├── LocationItemCard.tsx
│   │   │           └── ...
│   │   ├── hooks/
│   │   │   ├── useItemEdit.ts
│   │   │   ├── useLocationDetail.ts
│   │   │   ├── useLocationEdit.ts
│   │   │   ├── useProjectActions.ts
│   │   │   ├── useProjectDetail.ts
│   │   │   ├── useProjectIrregularities.ts
│   │   │   ├── useProjectLocations.ts
│   │   │   ├── useProjectMenuActions.ts
│   │   │   ├── useProjects.ts
│   │   │   └── useProjectSyncState.ts
│   │   ├── pages/
│   │   │   ├── LocationPage.tsx
│   │   │   ├── MyAccountPage.tsx
│   │   │   ├── PreferencesPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── InspectionSummaryPage.tsx
│   │   │   └── InspectionPage.tsx
│   │   └── utils/
│   │       └── inspectionStats.ts
│   ├── components/
│   │   └── ui/                # Design system primitives
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── circular-progress.tsx
│   │       ├── dialog.tsx
│   │       ├── icon.tsx
│   │       ├── progress.tsx
│   │       └── sonner.tsx
│   ├── lib/
│   │   └── utils.ts           # cn() helper (clsx + tailwind-merge)
│   ├── plataforma/            # Módulo futuro (vazio)
│   ├── shared/
│   │   ├── db/
│   │   │   ├── database.types.ts  # Tipos gerados pelo Supabase CLI
│   │   │   ├── dexie.ts           # VistoriaDB + entidades + índices
│   │   │   └── supabase.ts        # Cliente Supabase
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useConnectivity.ts
│   │   │   └── useStorageMonitor.ts
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── QueryProvider.tsx
│   │   ├── services/sync/
│   │   │   ├── drainQueue.integration.test.ts
│   │   │   ├── mappers.ts
│   │   │   ├── queueProcessor.ts
│   │   │   ├── syncService.integration.test.ts
│   │   │   ├── syncService.local.test.ts
│   │   │   └── syncService.ts
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── types/             # (diretório presente, conteúdo não inspecionado)
│   │   └── utils/
│   │       ├── lazyWithRetry.test.tsx
│   │       └── lazyWithRetry.ts
│   ├── test/
│   │   ├── setup.ts           # fake-indexeddb + jest-dom matchers
│   │   └── smoke.test.ts
│   ├── main.tsx               # Entry point
│   ├── router.tsx             # Rotas (React Router 7)
│   └── index.css
├── supabase/
│   ├── config.toml            # Edge Functions, auth redirects, project ref
│   ├── functions/
│   │   ├── _shared/           # cors, errors, assertAdmin, supabaseAdmin
│   │   ├── invite-user/
│   │   └── update-user/
│   ├── migrations/
│   └── seed.sql
├── package.json
├── vite.config.ts
├── tsconfig.json
└── eslint.config.js
```

## Module Organization

### campo/

**Propósito:** Toda a experiência de vistoria em campo — listagem de projetos, execução de vistorias, registro de evidências.
**Localização:** `src/campo/`
**Arquivos-chave:** `FieldGuard.tsx`, `FieldLayout.tsx`, `hooks/useItemEdit.ts`, `utils/inspectionStats.ts`

### shared/db/

**Propósito:** Camada de dados — banco local (Dexie/IndexedDB) e cliente remoto (Supabase).
**Localização:** `src/shared/db/`
**Arquivos-chave:** `dexie.ts` (definições de schema), `supabase.ts` (client singleton)

### shared/services/sync/

**Propósito:** Sincronização bidirecional offline → online. Fila de operações pendentes, drain, mapeadores.
**Localização:** `src/shared/services/sync/`
**Arquivos-chave:** `syncService.ts` (download, pull, check updates), `queueProcessor.ts` (enqueue, drain, discard)

### components/ui/

**Propósito:** Design system — primitivas sem lógica de negócio.
**Localização:** `src/components/ui/`

## Where Things Live

**Auth:**

- UI: `src/auth/LoginPage.tsx`
- Lógica: `src/shared/hooks/useAuth.ts`
- Estado: `src/shared/stores/authStore.ts`
- Guard: `src/campo/FieldGuard.tsx`

**Dados locais (Dexie):**

- Schema: `src/shared/db/dexie.ts`
- Leitura: `useLiveQuery` nos hooks em `campo/hooks/`

**Sync:**

- Download/pull: `src/shared/services/sync/syncService.ts`
- Enqueue/drain: `src/shared/services/sync/queueProcessor.ts`
- Mappers: `src/shared/services/sync/mappers.ts`

**Progresso/status de vistoria:**

- Cálculo: `src/campo/utils/inspectionStats.ts`
- Trigger: `recomputeProjectProgress()` chamado após mutações

**Roteamento:**

- Definição: `src/router.tsx`
- Proteção: `FieldGuard` (auth) wrapping `/campo`

**Edge Functions (Supabase):**

- Código: `supabase/functions/<nome>/index.ts`
- Shared: `supabase/functions/_shared/`
- Invoke no front: `src/shared/services/profileEdgeService.ts`
- Padrão de criação: `docs/codebase/SUPABASE_FUNCTIONS.md`
