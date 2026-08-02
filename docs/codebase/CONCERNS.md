# Codebase Concerns

**Data de análise:** 2026-07-27 (atualizado após auditoria de sync)

## Tech Debt

**`drainQueue` acessa store Zustand fora do React:**

- Issue: `useAuthStore.getState()` é chamado dentro de `processEntry` (função async pura, sem contexto React)
- Files: `src/shared/services/sync/queueProcessor.ts`
- Why: Necessidade de `userId` sem passar como parâmetro
- Impact: Mitigado — agora lança erro se user ausente (entry fica na fila para retry); acoplamento implícito permanece
- Fix approach: Receber `userId` como parâmetro em `drainQueue` / `processEntry`

**`syncStructure` é código morto:**

- Issue: Função exportada mas nunca chamada pela UI
- Files: `src/shared/services/sync/syncService.ts`
- Why: Caminho legado com regras de merge diferentes do `pullUpdates`
- Impact: Confusão para quem lê o sync; risco de alguém chamar por engano
- Fix approach: Remover ou documentar como interno/deprecated

## Fragile Areas

**Sync queue payload como JSON string:**

- Files: `src/shared/services/sync/queueProcessor.ts`, `queuePending.ts`
- Why fragile: Payload serializado como string JSON; parsing tipado por `entry.type` em `parseQueuePending`
- Safe modification: Manter campos por tipo (`id`, `itemId`, `evidenceId`, `locationId`, `projectId`); refactors de payload devem atualizar `parseQueuePending`

**Invariante de `syncedAt === null` em itens:**

- Files: `useItemEdit.ts`, `ItemsListSection.tsx`, `queueProcessor.ts` (dead letter)
- Why fragile: Edição local seta `syncedAt: null`; pull usa fila + baseline; dead letter de item também zera `syncedAt`
- Safe modification: Sempre setar `syncedAt: null` ao editar item; nunca setar `syncedAt` antes do `markSyncedAt` do drain

**Mídia híbrida B (path + signed URL):**

- Files: `syncService.ts` (`downloadProject` / `pullUpdates` / `downloadProjectMedia`), `EvidenceCard.tsx`
- Why fragile: Download/pull gravam só `storagePath` (sem blob); visualização online via `createSignedUrl`; offline exige "Baixar mídias para offline"
- Safe modification: Não reintroduzir hydrate eager em massa no download; preservar blob local quando `syncedAt === null`

**Schema Dexie versionado manualmente:**

- Files: `src/shared/db/dexie.ts` (versão atual: 7 — campo `storagePath` em evidence)
- Why fragile: Migrações IndexedDB são irreversíveis no browser do usuário; erro em uma versão pode corromper dados locais
- Safe modification: Sempre `this.version(N+1)`, nunca modificar versões existentes; testar upgrade path

## Performance Bottlenecks

**`useProjectSyncState` varre toda a syncQueue por projeto:**

- Problem: `db.syncQueue.toArray()` carrega todas as entradas e filtra em JS para encontrar as do projeto
- Files: `src/campo/hooks/useProjectSyncState.ts`
- Measurement: Sem medição — problema potencial com filas grandes (>100 entradas)
- Improvement path: Adicionar índice por `projectId` na syncQueue (requer migração de schema), ou indexar por `itemId` no payload

**Evidence blobs no IndexedDB:**

- Problem: Resolvido para capturas — `markSyncedAt` zera `blob` após `evidence_add` sincronizar, liberando espaço automaticamente. Residual: blobs hidratados via "Baixar mídias para offline" (`downloadProjectMedia`) continuam sem eviction automática (comportamento intencional — usuário pediu mídia offline)
- Files: `queueProcessor.ts` (`markSyncedAt`), `useStorageMonitor.ts` (ligado a `FieldLayout` via `StorageAlmostFullBanner`)
- Measurement: `useStorageMonitor` alimenta banner em Campo quando uso > 80%
- Improvement path: Se blobs hidratados manualmente ainda encherem quota em campo, avaliar ação manual "Liberar espaço" (fora do MVP atual)

## Security Considerations

**Supabase anon key exposta via env var de build:**

- Risk: `VITE_SUPABASE_ANON_KEY` é injetada no bundle client-side (comportamento padrão Vite)
- Files: `src/shared/db/supabase.ts`
- Current mitigation: Anon key limitada por RLS
- Recommendations: Garantir RLS ativo; nunca `service_role` no client

**Bucket `evidence` privado + signed URLs:**

- Risk: URLs assinadas expiram; path previsível `{projectId}/{itemId}/{evidenceId}`
- Files: `evidenceDownload.ts` (`createEvidenceSignedUrl`), Storage RLS admin/cliente
- Current mitigation: Bucket privado; download autenticado / signed URL com TTL
- Recommendations: Confirmar que role de técnico de campo tem política adequada (hoje seed usa `admin`)

## Test Coverage Gaps

**E2E sem cobertura:**

- What's not tested: Fluxos completos de usuário (login → download projeto → executar vistoria → sync)
- Risk: Regressões em integração UI + DB + sync passam despercebidas
- Priority: Alto

**`drainQueue` com erros de rede reais:**

- What's not tested: Comportamento com falhas intermitentes de rede durante drain (mock retorna erro, mas sem simulação de retry acumulado)
- Risk: Lógica de retry pode ter bug que só aparece após múltiplas falhas
- Priority: Médio

**`useItemEdit.handleSave` com erros de Dexie:**

- What's not tested: `QuotaExceededError` já tem toast dedicado; outros erros de Dexie (ex.: corrupção, transação abortada) ainda caem no toast genérico sem teste específico
- Risk: Usuário pode não entender a causa de falhas fora de quota
- Priority: Baixo

## Resolvido desde análise anterior (2026-06-14)

- Retries da syncQueue: após 3 tentativas → `deadLetterQueue` + toast
- `drainQueue` dispara no `online` e no mount se já online (`FieldLayout`); processa snapshot completo da fila (batches de 10) com mutex
- `conflictStatus` tem UI em `ItemCard` / `ItemsListSection`
- Proteção de pull para locations pendentes e de `syncProjectList` para `project_update` pendente
- `evidence_add` / `item_add` / `location_add` usam upsert (idempotente)
- Docs de URL pública / bucket público estavam stale — corrigido neste arquivo e em INTEGRATIONS.md
- Eviction de blob pós-sync de evidência (`evidence_add`) + banner de quota (`useStorageMonitor`) + contador "Pendente (N)" na badge de sync (2026-07-28)

## Scaling Limits

**IndexedDB quota do browser:**

- Current capacity: Varia por browser/dispositivo (tipicamente 50-80% do espaço livre)
- Limit: Capturas evacuam `blob` pós-sync automaticamente; mídias hidratadas manualmente e projetos antigos ainda não têm eviction
- Scaling path: Implementar eviction de projetos antigos; ação manual de "Liberar espaço" para mídias hidratadas se necessário

## Dependencies at Risk

**`plataforma/` — diretório vazio:**

- Risk: Não é uma dependência, mas indica módulo planejado não implementado — importações para esse módulo podem existir e falhar em runtime
- Migration plan: Verificar se algum import aponta para `src/plataforma/` antes de implementar
