# Integrations — Fourlab ERP

## Supabase

- Project: `fihthjhpigwbaievvcay`
- Client: `src/shared/db/supabase.ts` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Tipos: `npm run db:types` → `src/shared/db/database.types.ts`
- Link: `npm run db:link`
- Baseline: `supabase/migrations/20260802180000_baseline_schema.sql`
- Seed: `supabase/seed.sql` (admin `jplima08.dev@gmail.com`)

## Auth

- Supabase Auth (email/senha)
- Perfil em `public.profiles` (`id` = `auth.users.id`)
- Sem RBAC: qualquer usuário autenticado acessa todas as tabelas; anon bloqueado

## Storage

- Buckets privados: `product-files`, `quality-photos`
- Colunas guardam path (não URL pública)

## Edge Functions

Legado de vistoria (`invite-user` / `update-user`) — fora do escopo do ERP MVP. Ver [SUPABASE_FUNCTIONS.md](./SUPABASE_FUNCTIONS.md) se reativar.

## PWA

- Plugin Vite PWA
- Manifest Fourlab ERP, `start_url: /`
- Precache de assets estáticos

## Aplicar no remoto (`fihthjhpigwbaievvcay`)

A conta OAuth do MCP Supabase neste ambiente só enxerga o projeto antigo (`wmqbpkytypriizocerdq` / org Lima). O projeto Fourlab precisa estar na mesma conta/org, ou o MCP precisa ser reautenticado com a conta dona de `fihthjhpigwbaievvcay`.

Depois do acesso:

```bash
npm run db:link
npm run db:migrate
npm run db:seed
npm run db:types
```

Ou no Dashboard: SQL Editor → colar `supabase/migrations/20260802180000_baseline_schema.sql` → Authentication → criar usuário `jplima08.dev@gmail.com` → rodar a parte de `profiles` + `financial_categories` de `supabase/seed.sql`.

Validação local já feita: `supabase db reset` aplica migration + seed (1 user, 1 profile, 5 categorias, 2 buckets).
