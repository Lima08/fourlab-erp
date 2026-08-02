# Soraia App

PWA offline-first para vistórias técnicas de segurança contra incêndio.

O app foi criado para técnicos de campo que precisam executar checklists de vistoria
com foto, comentário e status item a item, mesmo quando não há internet.
A fonte de verdade em campo é o banco local (`Dexie/IndexedDB`).

## O que este repositório contém

- `src/campo/`: fluxo de vistoria offline, telas e regras de negócio de campo.
- `src/plataforma/`: componentes e páginas de apoio à plataforma.
- `src/components/ui/`: componentes visuais puros sem acesso direto ao banco.
- `src/shared/db/`: Dexie local e integração inicial com Supabase.
- `src/shared/providers/`: providers de auth e query.
- `AGENTS.md`: orientações de desenvolvimento e regras do projeto.
- `docs/epics/campo-prd.md`: requisitos do campo.
- `docs/epics/campo-green-field-tdd.md`: decisões técnicas do campo.

## Principais características

- offline-first: operação de vistoria completa funciona sem conexão após o projeto ser baixado
- persistência local em tempo real no Dexie
- status fixos: `pending`, `regular`, `irregular`, `absent`
- bloqueio de encerramento com pendências ou irregularidades sem evidência
- sincronização oportunista com Supabase
- PWA instalável e validação de cache via `vite-plugin-pwa`

## Scripts úteis

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Supabase

O projeto usa Supabase como backend remoto (Postgres + Auth + Storage).
O cliente é tipado via `createClient<Database>` com tipos gerados automaticamente — **nunca edite `src/shared/db/database.types.ts` à mão**.

### Configuração inicial

Copie `.env.example` para `.env.local` e preencha com as chaves do projeto:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

As chaves ficam em **Project Settings → API** no painel do Supabase.
Use sempre a `anon` key no front-end — nunca a `service_role`.

### Autenticação do CLI

Na primeira vez em uma máquina nova, autentique o CLI do Supabase:

```bash
npm run db:login
```

Isso abre o navegador para login na conta Supabase. Necessário para os comandos `db:migrate` e `db:types`.

### Criação do Primeiro Admin

O primeiro administrador do sistema deve ser inserido manualmente no banco de dados, pois a tabela `user_roles` possui RLS restritivo. Após criar a conta pelo app ou painel do Supabase (Auth), execute o seguinte SQL no **SQL Editor** do painel do Supabase:

```sql
-- Substitua 'uuid-do-usuario-aqui' pelo ID do usuário gerado no Supabase Auth
insert into public.user_roles (user_id, role)
values ('uuid-do-usuario-aqui', 'admin');
```

Só depois disso o admin poderá cadastrar outros papéis (roles) através da aplicação ou API.

### Criar uma migration

```bash
npm run db:migration:new -- nome_da_migration
```

Cria `supabase/migrations/<timestamp>_nome_da_migration.sql`. Edite o arquivo gerado com o DDL desejado antes de aplicar.

### Aplicar migrations ao banco remoto

```bash
npm run db:migrate
```

Envia todas as migrations ainda não aplicadas ao projeto `wmqbpkytypriizocerdq`.
Requer autenticação prévia via `db:login`.

### Regenerar tipos TypeScript

Sempre que uma migration for aplicada, regenere os tipos:

```bash
npm run db:types
```

Atualiza `src/shared/db/database.types.ts` com o schema real do Postgres.
**Commite o arquivo atualizado junto com a migration.**

### Fluxo completo de mudança de schema

```bash
# 1. criar
npm run db:migration:new -- adiciona_coluna_xyz

# 2. editar supabase/migrations/<timestamp>_adiciona_coluna_xyz.sql

# 3. aplicar
npm run db:migrate

# 4. atualizar tipos
npm run db:types

# 5. commitar migration + tipos juntos
git add supabase/migrations/ src/shared/db/database.types.ts
git commit -m "feat(db): adiciona coluna xyz"
```

### Usando os tipos gerados

Prefira os helpers gerados a interfaces manuais:

```ts
import type { Tables, TablesInsert, TablesUpdate } from '@/shared/db/database.types'

type RemoteItem = Tables<'items'> // shape de SELECT
type NewItem = TablesInsert<'items'> // shape de INSERT
type ItemPatch = TablesUpdate<'items'> // shape de UPDATE
```

---

## Convenções chave

- TypeScript strict e `noUncheckedIndexedAccess` ativado.
- `@/` é alias para `src/`.
- UI não acessa Dexie diretamente; dados e handlers vêm de hooks/domínio.
- Sem `any` implícito, sem comentários óbvios.
- PT-BR em UI, docs e commits.

## Build e validação

- `npm run build` deve passar sem erros.
- `npx tsc --noEmit` deve passar.
- `npm run lint` não deve introduzir novos erros.
- use `npm run build && npm run preview` para validar PWA/offline.

## Deploy (Cloudflare Pages)

O frontend é estático (`dist/`) e publica no **Cloudflare Pages**. Backend permanece no **Supabase**.

| | |
| --- | --- |
| Produção | https://soraia-vistoria.pages.dev |
| Host | Cloudflare Pages |
| Pipeline | GitHub Actions (`.github/workflows/ci.yml`) |
| Config local / preview | `wrangler.jsonc` + `npm run preview` |

**Não há deploy automático no merge.** Publicação é manual:

1. Gate verde no PR (base `main` ou `develop`)
2. Merge
3. **Actions → CI/CD → Run workflow**
   - branch `main` + Deploy marcado → produção
   - outra branch + Deploy marcado → preview

Secrets/vars ficam no Environment GitHub `development` (`VITE_SUPABASE_*`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

Localmente (não substitui o fluxo de CI de produção):

```bash
npm run deploy   # build + wrangler deploy
```

Guia completo: [`docs/codebase/DEPLOY.md`](docs/codebase/DEPLOY.md).

## Referências importantes

- `AGENTS.md` / `CLAUDE.md`
- `docs/codebase/DEPLOY.md`
- `docs/codebase/ARCHITECTURE.md`
- `docs/codebase/TESTING.md`
- `docs/codebase/INTEGRATIONS.md`
- `docs/campo/campo-prd.md`
- `docs/campo/campo-green-field-tdd.md`
