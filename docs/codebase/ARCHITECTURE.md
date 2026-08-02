# Architecture

**Padrão:** Offline-First PWA com sync queue unidirecional

## Visão Geral

```
┌──────────────────────────────────────────────────────┐
│                    Browser (PWA)                     │
│                                                      │
│  ┌─────────────┐    ┌──────────────┐                 │
│  │  React UI   │◄──►│  Dexie       │  IndexedDB      │
│  │  (campo/)   │    │  VistoriaDB  │  (source of     │
│  └──────┬──────┘    └──────┬───────┘   truth)        │
│         │                  │                         │
│         │           ┌──────▼───────┐                 │
│         └──────────►│  syncService │                 │
│                     │  + queue     │                 │
│                     └──────┬───────┘                 │
└────────────────────────────┼────────────────────────┘
                             │ HTTPS (quando online)
                    ┌────────▼────────┐
                    │    Supabase     │
                    │  PostgreSQL +   │
                    │  Auth + Storage │
                    └─────────────────┘
```

## Módulos

### `src/campo/` — App de vistoria (field work)

O módulo principal. Contém tudo relacionado à execução de vistorias em campo.

- `pages/` — rotas lazy (ProjectsPage, InspectionPage, LocationPage, etc.)
- `components/projetos/` — componentes de listagem e detalhamento de projetos
- `hooks/` — lógica de negócio encapsulada em hooks (useProjects, useItemEdit, etc.)
- `utils/inspectionStats.ts` — cálculos de progresso e status derivados

### `src/auth/` — Autenticação

Apenas `LoginPage.tsx`. Estado de auth vive em `shared/`.

### `src/shared/` — Infraestrutura compartilhada

- `db/dexie.ts` — definição do banco local (entidades, índices, versões)
- `db/supabase.ts` — cliente Supabase (criado com env vars)
- `db/database.types.ts` — tipos gerados pelo Supabase CLI
- `services/sync/` — syncService, queueProcessor, mappers
- `hooks/` — useAuth, useConnectivity, useStorageMonitor
- `stores/authStore.ts` — Zustand store com user + sessionExpired
- `providers/` — AuthProvider, QueryProvider
- `utils/lazyWithRetry.ts` — wrapper de lazy import com retry

### `src/components/ui/` — Design system primitives

Componentes genéricos reutilizáveis (badge, button, dialog, icon, progress, sonner).

## Padrões Identificados

### Offline-First com Sync Queue

**Local:** Toda escrita vai direto para Dexie.
**Remote:** Uma entrada em `syncQueue` é enfileirada para cada mutação.
**Drain:** `FieldLayout` chama `drainQueue()` no mount (se online) e no evento `online`; mutex evita concorrência; processa snapshot da fila em batches de 10.
**Dead Letter:** Após 3 falhas, move para `deadLetterQueue` + toast; item dead-lettered recebe `syncedAt: null`.
**Pending sets:** `queuePending.ts` parseia a fila por tipo (item/location/project/evidence) para o pull não stompar edições locais.

Exemplo: `src/campo/hooks/useItemEdit.ts` → `enqueueItemUpdate()` → `queueProcessor.ts` → Supabase

### Mídia híbrida (path + signed URL)

`downloadProject` / `pullUpdates` gravam metadata + `storagePath` (sem baixar blobs). Online: `EvidenceCard` usa signed URL. Offline: ação “Baixar mídias para offline” (`downloadProjectMedia`) hidrata blobs sob demanda. Capturas locais continuam com `blob` no Dexie até sync.

### Live Queries Reativas

Hooks usam `useLiveQuery` (dexie-react-hooks) para re-renderizar automaticamente quando dados locais mudam. Não há `useEffect` de polling — a reatividade vem do Dexie.

### Separação Hook / Componente

Lógica de negócio encapsulada em hooks em `campo/hooks/`. Componentes são puramente visuais. Exemplo: `useItemEdit.ts` expõe uma interface rica; `ItemEditModal.tsx` apenas renderiza.

### Mapeadores bidireccionais

`src/shared/services/sync/mappers.ts` converte entre formato remoto (snake_case, Supabase row) e local (camelCase, Dexie entity).

### Lazy Loading com Retry

`lazyWithRetry` encapsula `React.lazy` com retry automático via `?reload=N` para lidar com falhas de rede em chunks.

## Fluxo de Dados — Download de Projeto

```
ProjectsPage → downloadProject(id)
  → supabase.from('projects/locations/items/evidence/project_sync_state') [paralelo]
  → mapear evidence com storagePath (sem hydrate de blob)
  → db.transaction([clients, projects, locations, items, evidence])
  → recomputeProjectProgress(id)
```

## Fluxo de Dados — Edição de Item

```
ItemEditModal → useItemEdit.handleSave()
  → db.items.update(..., syncedAt: null)  [local imediato]
  → db.evidence.add(..., storagePath: null) [opcional]
  → enqueueItemUpdate(item) / enqueueEvidenceAdd  [sync queue]
  → recomputeProjectProgress [atualiza contadores no projeto]
```

## Fluxo de Sincronização Remota

```
drainQueue() [FieldLayout: mount online + evento online; também sync manual]
  → mutex: uma execução por vez
  → snapshot de IDs da fila; processa em batches de 10
  → processEntry(entry) → Storage upsert (mídia) + Postgres upsert
  → db.syncQueue.delete(entry.id) + markSyncedAt()
  → em erro: attempts++; após 3 → deadLetterQueue + toast
```

## Detecção de Updates Remotos

```
checkForUpdates(projectId)
  → supabase.from('project_sync_state').select('last_modified_at')
  → compara com project.syncedAt
  → se remoto > local: project.updateState = 'update_available'
```

## Autenticação

```
AuthProvider (useAuth hook)
  → supabase.auth.getSession() → setUser
  → supabase.auth.onAuthStateChange → setUser / setSessionExpired
  → Zustand authStore persiste user
FieldGuard → redireciona para /login se !user
```

## Code Organization

**Approach:** Feature-based (campo, auth, shared) + layer-based dentro de cada feature (pages, components, hooks, utils)
**Module boundaries:** `shared/` é consumido por todos; `campo/` não importa de `auth/`; sem imports circulares conhecidos

---

## Banco local — Migrações Dexie

Regra: só `this.version(N+1)`. Nunca editar versão existente — dispositivos em campo têm dados reais e migração destrutiva perde vistorias.

```ts
this.version(2)
  .stores({ projects: 'id, status, downloadedAt, downloadState' })
  .upgrade(async (tx) => {
    await tx
      .table('projects')
      .toCollection()
      .modify((p) => {
        p.downloadState = p.downloadedAt ? 'device' : 'cloud'
      })
  })
```

Coordenar migrações entre épicos. `upgrade()` obrigatório quando dados existentes precisam ser transformados.

---

## PWA — Service Worker e Cache

Configuração: `vite.config.ts` via `vite-plugin-pwa` + Workbox.

| Camada                                         | Estratégia                       |
| ---------------------------------------------- | -------------------------------- |
| App shell / assets estáticos                   | Precache (lista gerada no build) |
| Rotas `/campo/*`                               | `CacheFirst` (`campo-assets`)    |
| Dados de negócio (projetos, itens, evidências) | IndexedDB via Dexie — fora do SW |
| Endpoints autenticados do Supabase             | Não cachear no SW                |

Regra: cache de assets = SW. Persistência de dados = Dexie + `syncQueue`. Nunca cachear respostas autenticadas do Supabase no SW.

**Atualização:** `autoUpdate` — nova versão baixa em background, assume no próximo carregamento sem prompt.

---

## PWA — Quota e armazenamento persistente

Hook: `src/shared/hooks/useStorageMonitor.ts`

- `navigator.storage.persist()` na primeira execução — evita descarte silencioso pelo browser.
- `navigator.storage.estimate()` — expõe `usageBytes`, `quotaBytes`, `usagePercent`, `isAlmostFull` (> 80%).
- Capacidade-alvo: ≥ 200 fotos e 5 vídeos por projeto.
- `QuotaExceededError`: avisar sem bloquear vistoria — nunca interromper o fluxo de campo.
