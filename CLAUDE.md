# Fourlab — ERP

PWA mobile-first (React + Supabase) para gestão empresarial da Fourlab (produtos impressos em 3D).

## Módulos

| Módulo | Propósito |
| -------------------- | ------------------------------------------------------------- |
| `src/app/` | Shell autenticado — layout, guard, home, módulo clientes |
| `src/shared/` | Supabase client, auth, profiles, providers, utils |
| `src/auth/` | Login e fluxos de senha/ativação |
| `src/components/ui/` | Design system headless (Base UI + Tailwind + CVA) |

## Regras críticas

1. **Fonte da verdade = Supabase.** Mutações via client anon + RLS (ou Edge Functions admin). Sem Dexie/sync offline nesta base.
2. **`database.types.ts` é gerado.** Não editar. Após migration: `npm run db:types` e commitar.
3. **Testes:** descrições `describe/it/test` em PT-BR.
4. **Identificadores em inglês:** nomes de arquivos, funções, tipos e constantes exportadas — sempre inglês. UI/toasts em PT-BR. Detalhes em `docs/codebase/CONVENTIONS.md` § Language.
5. **Mobile-first:** UI parte do viewport mobile (~375px), formulários em página dedicada, bottom nav no mobile / header em `md+`. Detalhes em `docs/codebase/CONVENTIONS.md` § Mobile-first.

## Gate obrigatório (antes de fechar qualquer task)

```bash
npx tsc --noEmit && npm run lint && npm run test:run && npm run build
```

## Contexto sob demanda

| Situação | Arquivo |
| ---------------------------------------- | ------------------------------- |
| Escrever código novo | `docs/codebase/CONVENTIONS.md` |
| Planejar feature — arquitetura / módulos | `docs/codebase/ARCHITECTURE.md` |
| Navegar pasta / localizar arquivo | `docs/codebase/STRUCTURE.md` |
| Escolher lib / versão de dependência | `docs/codebase/STACK.md` |
| Áreas de risco antes de modificar | `docs/codebase/CONCERNS.md` |
| Escrever ou revisar testes | `docs/codebase/TESTING.md` |
| Supabase / migrations / RLS / tipos | `docs/codebase/INTEGRATIONS.md` |
| Edge Functions | `docs/codebase/SUPABASE_FUNCTIONS.md` |
| Build, deploy, PWA | `docs/codebase/STACK.md` / `DEPLOY.md` |

## Fronteiras de módulo

- `app/` = domínio do produto (shell + features futuras).
- `components/ui/` = primitivos puros — sem Supabase, sem store, sem lógica de negócio.
- `shared/` = infra (db, providers, stores, hooks) — consumido por todos.
- UI recebe dados e handlers via props. Sem lógica de negócio em componente.

## Armadilhas

- ❌ Commit `.env.local`. ✅ Só `.env.example` no repo.
- ❌ `service_role` key no front. ✅ Só `VITE_SUPABASE_ANON_KEY`.
- ❌ Editar `database.types.ts` à mão. ✅ `npm run db:types`.
- ❌ Arquivo/função/constante em português. ✅ Inglês; PT-BR só em strings de UI e URLs públicas.

## Roadmap de domínio (próximas features)

- Controle financeiro geral
- Cadastro de clientes
- Controle de estoque
- Controle de linha de produção

## Comandos úteis

```bash
npm run dev # dev server
npm run build # build de produção
npm run test # vitest watch
npm run test:run # vitest single run (CI)
npm run db:types # regenera database.types.ts
npm run db:migration:new # nova migration SQL
npm run db:migrate # aplica migrations no Supabase remoto
npm run db:functions # serve Edge Functions local (invite-user, update-user)
npm run tunnel # ngrok → porta 5173
```

## Docs

```
docs/
└── codebase/ # Estado atual do codebase (as-built)
    ├── ARCHITECTURE.md
    ├── CONVENTIONS.md
    ├── INTEGRATIONS.md
    ├── SUPABASE_FUNCTIONS.md
    ├── STACK.md
    ├── STRUCTURE.md
    ├── TESTING.md
    ├── DEPLOY.md
    └── CONCERNS.md
```
