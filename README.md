# Fourlab ERP

PWA mobile-first com React + Supabase para gestão empresarial da Fourlab (impressão 3D).

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS + Base UI (design system em `src/components/ui/`)
- Supabase (Auth, Postgres, Edge Functions)
- TanStack Query + Zustand (auth)
- PWA via `vite-plugin-pwa`

## Estrutura

| Pasta | Função |
| --- | --- |
| `src/app/` | Shell autenticado (guard, layout, home) |
| `src/auth/` | Login, recuperação e ativação de conta |
| `src/shared/` | Supabase, auth store, profiles, providers |
| `src/components/ui/` | Primitivos de UI |
| `supabase/` | Migrations, seed, Edge Functions |

## Desenvolvimento

```bash
cp .env.example .env.local   # preencher VITE_SUPABASE_*
npm install
npm run dev
```

Gate local:

```bash
npm run gate
```

## Deploy

Cloudflare Pages (`wrangler` / CI). Ver [docs/codebase/DEPLOY.md](docs/codebase/DEPLOY.md).

## Próximos módulos

- Financeiro
- Clientes
- Estoque
- Linha de produção
