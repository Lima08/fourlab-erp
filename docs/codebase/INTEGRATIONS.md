# External Integrations

## Variáveis de ambiente

`.env.local` (ignorado pelo git). Prefixo `VITE_` → embutido no bundle público.

```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

- Nunca `service_role` key no front.
- Nunca commitar `.env.local`.
- Segurança real = RLS no Postgres, não esconder a anon key.

---

## Database / Backend

**Serviço:** Supabase (projeto `wmqbpkytypriizocerdq`)
**Propósito:** PostgreSQL remoto, Auth, Storage de evidências, detecção de updates via `project_sync_state`
**Implementação:** `src/shared/db/supabase.ts` — singleton `createClient<Database>(url, anonKey)`
**Configuração:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (env vars, build-time)
**Autenticação:** Supabase Auth (sessão via cookies/localStorage gerenciado pelo SDK)

### Tabelas usadas

| Tabela               | Operações                                   | Local                                          |
| -------------------- | ------------------------------------------- | ---------------------------------------------- |
| `projects`           | select, update                              | `syncService.ts`                               |
| `locations`          | select, insert, upsert, delete              | `syncService.ts`, `queueProcessor.ts`          |
| `items`              | select, insert, upsert, update, soft-delete | `syncService.ts`, `queueProcessor.ts`          |
| `evidence`           | select, upsert, delete                      | `syncService.ts`, `queueProcessor.ts`          |
| `clients`            | select                                      | `syncService.ts`                               |
| `project_sync_state` | select (`last_modified_at`)                 | `syncService.ts` (detecção de updates remotos) |

### Storage

**Bucket:** `evidence` (privado)
**Path pattern:** `{projectId}/{itemId}/{evidenceId}`
**Upload:** `supabase.storage.from('evidence').upload(path, blob, { upsert: true })`
**Referência no Postgres:** `evidence.blob_url` guarda o **path** do Storage (não URL pública)
**Visualização:** signed URL via `createEvidenceSignedUrl` (TTL); download de blob sob demanda em `downloadProjectMedia`
**Limites:** pós-compressão — foto 10 MB / vídeo 50 MB; pré-compressão — foto 50 MB / vídeo 200 MB (validação + compressão no client)
**Download de projeto:** grava metadata + `storagePath` sem baixar blobs (híbrido B); botão “Baixar mídias para offline” hidrata blobs

## Authentication

**Serviço:** Supabase Auth — e-mail/senha. JWT persiste em `localStorage` → técnico loga uma vez, app segue offline.
**Implementação:** `src/shared/hooks/useAuth.ts` + `src/shared/stores/authStore.ts`
**Fluxo:**

1. `supabase.auth.getSession()` no mount → inicializa estado
2. `supabase.auth.onAuthStateChange()` → atualiza `user` e `sessionExpired`
3. `FieldGuard` consulta store e redireciona se não autenticado

**Eventos tratados:** `TOKEN_REFRESHED`, `TOKEN_REFRESH_FAILED`, `SIGNED_OUT`

**Comportamento offline:** sessão expirada não bloqueia vistoria — só trava sync. `FieldGuard` só redireciona para `/login` quando **online** e sem usuário.

## Sync Queue (interno)

**Não é um serviço externo**, mas é a peça central da integração offline→online:

- **Enqueue:** operações locais chamam funções em `queueProcessor.ts`
- **Drain:** `drainQueue()` no mount se online + evento `online` (`FieldLayout`); também em sync/pull manuais; mutex evita concorrência; processa snapshot da fila em batches de 10
- **Retry:** até 3 tentativas (`attempts`); depois move para `deadLetterQueue` + toast
- **Dead Letter:** armazena entradas com falha permanente; item dead-lettered recebe `syncedAt: null` para o pull não sobrescrever edição local silenciosamente
- **Mídia:** `evidence_add` faz Storage upload + Postgres upsert; path resolvido só com `item.projectId` presente (sem fallback `unknown`)

## PWA / Service Worker

**Plugin:** vite-plugin-pwa (Workbox, `registerType: 'autoUpdate'`)
**Estratégia de cache:** CacheFirst para `/campo/*`
**Manifest:** `display: standalone`, `start_url: /campo`, tema azul (`#1e40af`)
**Atualização:** Service worker atualiza automaticamente em segundo plano

## Supabase — Tipos gerados e migrations

**Tipos gerados — nunca editar à mão** (`src/shared/db/database.types.ts`):

```ts
import type { Tables, TablesInsert, TablesUpdate } from '@/shared/db/database.types'
type RemoteItem = Tables<'items'>
type NewItem = TablesInsert<'items'>
type ItemPatch = TablesUpdate<'items'>
```

**Workflow de migration (CLI):**

```bash
npm run db:migration:new -- nome_da_migration
# editar supabase/migrations/<timestamp>_nome_da_migration.sql
npm run db:migrate   # aplica ao remoto (requer db:login)
npm run db:types     # regenera tipos — commitar database.types.ts
```

**Claude Code + MCP Supabase:** usar `mcp__supabase__apply_migration` + `mcp__supabase__generate_typescript_types` — sem necessidade de auth CLI.

RLS obrigatório em toda tabela. MVP: `auth.role() = 'authenticated'` em todas as policies — sem acesso anônimo.

## Edge Functions

Operações que exigem **Auth Admin API** ou `service_role` (ex.: convite de usuário). Não substituem o sync queue do campo.

| Function       | Propósito                          | Front                          |
| -------------- | ---------------------------------- | ------------------------------ |
| `invite-user`  | Criar / reenviar convite           | `profileEdgeService.ts`        |
| `update-user`  | Atualizar perfil + e-mail Auth     | `profileEdgeService.ts`        |

**Criar ou modificar functions:** seguir `docs/codebase/SUPABASE_FUNCTIONS.md` (template, `_shared/`, erros, deploy, GRANTs).

```bash
npm run db:functions   # serve local
supabase functions deploy <nome>
```

Secrets: `SITE_URL` (redirect de e-mail). Ver `supabase/config.toml` e `.env.example`.

---

## Checklist — novo ambiente

- [ ] Projeto Supabase criado; URL e anon key copiadas para `.env.local`.
- [ ] Tabelas criadas com RLS habilitado.
- [ ] Policies: acesso a autenticados, bloqueado para anônimos.
- [ ] Bucket(s) Storage com policies coerentes (sem leitura anônima).
- [ ] Usuários técnicos criados no Supabase Auth.
- [ ] Envs configuradas no host de deploy.
- [ ] SPA fallback + HTTPS configurados no host.
- [ ] `npm run build && npm run preview` validados; PWA instalável e offline funcionando.

---

## Development Tools

**ngrok:** `npm run tunnel` → expõe porta 5173 com HTTPS para testes em dispositivos reais
**Supabase CLI:**

- `npm run db:types` → regenera `database.types.ts`
- `npm run db:migration:new` → cria nova migration
- `npm run db:migrate` → aplica migrations no projeto remoto
