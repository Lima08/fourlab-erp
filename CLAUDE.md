# Soraia — Vistoria App

PWA offline-first para vistorias técnicas (bombeiros). Técnico usa tablet em campo sem internet. IndexedDB (Dexie) = fonte da verdade. Sobe para Supabase quando online via sync queue.

## Módulos

| Módulo               | Propósito                                                     |
| -------------------- | ------------------------------------------------------------- |
| `src/campo/`         | App de vistoria — offline-first, React + Dexie + live queries |
| `src/shared/`        | DB (Dexie + Supabase), sync queue, auth, providers            |
| `src/auth/`          | Só LoginPage.tsx; estado de auth em shared/                   |
| `src/components/ui/` | Design system headless (Base UI + Tailwind + CVA)             |

## Regras críticas

1. **Nunca escrever direto no Supabase.** Toda mutação: Dexie primeiro → `enqueue*()` → drain
2. **Migração Dexie:** só `this.version(N+1)`. Nunca editar versão existente — dispositivos em campo têm dados reais
3. **`database.types.ts` é gerado.** Não editar. Após migration: `npm run db:types` e commitar
4. **`syncedAt === null` em item/evidence** = edição local não sincronizada → pull não sobrescreve; ao editar item, sempre zerar `syncedAt`
5. **Testes:** descrições `describe/it/test` em PT-BR; `db.delete() + db.open()` no `beforeEach` de integração
6. **Mídia híbrida:** `downloadProject` / `pullUpdates` gravam só `storagePath` (sem blob). Visualização online via signed URL; offline exige “Baixar mídias para offline” (`downloadProjectMedia`)
7. **Drain:** `FieldLayout` chama `drainQueue` no mount (se online) e no evento `online`; mutex evita concorrência; processa snapshot da fila (batches de 10); após 3 falhas → dead letter
8. **Identificadores em inglês:** nomes de arquivos, funções, tipos e constantes exportadas — sempre inglês. UI/toasts em PT-BR. Detalhes e exceções em `docs/codebase/CONVENTIONS.md` § Language.

## Gate obrigatório (antes de fechar qualquer task)

```bash
npx tsc --noEmit && npm run lint && npm run test:run && npm run build
```

## Contexto sob demanda

Carregar apenas o necessário para a tarefa:

### Produto / Requisitos

| Situação                              | Arquivo                               |
| ------------------------------------- | ------------------------------------- |
| Entender o que deve ser construído    | `docs/campo/campo-prd.md`             |
| Revisitar decisões técnicas originais | `docs/campo/campo-green-field-tdd.md` |

### Codebase atual (as-built)

| Situação                                 | Arquivo                         |
| ---------------------------------------- | ------------------------------- |
| Escrever código novo                     | `docs/codebase/CONVENTIONS.md`  |
| Planejar feature — arquitetura / módulos | `docs/codebase/ARCHITECTURE.md` |
| Navegar pasta / localizar arquivo        | `docs/codebase/STRUCTURE.md`    |
| Escolher lib / versão de dependência     | `docs/codebase/STACK.md`        |
| Áreas de risco antes de modificar        | `docs/codebase/CONCERNS.md`     |

### Qualidade

| Situação                       | Arquivo                    |
| ------------------------------ | -------------------------- |
| Escrever ou revisar testes     | `docs/codebase/TESTING.md` |
| Gate check, cobertura, padrões | `docs/codebase/TESTING.md` |

### Infra / Integrações

| Situação                                        | Arquivo                         |
| ----------------------------------------------- | ------------------------------- |
| Supabase / migrations / RLS / tipos / checklist | `docs/codebase/INTEGRATIONS.md` |
| Criar ou alterar Edge Functions                 | `docs/codebase/SUPABASE_FUNCTIONS.md` |
| PWA / Service Worker / offline / quota          | `docs/codebase/ARCHITECTURE.md` |
| Build, deploy, SPA fallback, HTTPS              | `docs/codebase/STACK.md`        |
| Validar offline / DevTools PWA                  | `docs/codebase/TESTING.md`      |

## Fronteiras de módulo

- `campo/` e `plataforma/` = domínio. Não cruzar entre si.
- `components/ui/` = primitivos puros — sem Dexie, sem store, sem lógica de negócio.
- `shared/` = infra (db, providers, stores, hooks) — consumido por todos.
- UI recebe dados e handlers via props. Sem lógica de negócio em componente.
- Nunca modifique fluxo offline sem confirmar impacto em campo.

## Armadilhas

- ❌ UI espera rede. ✅ Lê Dexie, rede é async em background.
- ❌ Dexie dentro de `components/ui/`. ✅ Só em hooks de `campo/` ou `shared/`.
- ❌ Commit `.env.local`. ✅ Só `.env.example` no repo.
- ❌ `service_role` key no front. ✅ Só `VITE_SUPABASE_ANON_KEY`.
- ❌ Editar `database.types.ts` à mão. ✅ `npm run db:types`.
- ❌ Validar offline em `npm run dev`. ✅ `npm run build && npm run preview`.
- ❌ Foto sem comprimir antes de salvar. ✅ `browser-image-compression` antes do Dexie.
- ❌ Arquivo/função/constante em português (`VistoriaPage`, `usuarioFormSchema`). ✅ Inglês (`InspectionPage`, `userFormSchema`); PT-BR só em strings de UI e URLs públicas.

## Concerns ativos (ler antes de tocar essas áreas)

- **`syncStructure`** existe e não é chamado pela UI — regras de merge diferentes de `pullUpdates`; não reativar sem alinhar
- **`useProjectSyncState`** varre queue inteira por projeto — lento com filas grandes
- **Quota IndexedDB:** blobs hidratados não são evacuados automaticamente após sync; `useStorageMonitor` existe mas não está ligado à UI
- **RLS:** roles só `admin`/`cliente` — técnicos de campo hoje operam como admin no seed

## Comandos úteis

```bash
npm run dev              # dev server
npm run build            # build de produção
npm run test             # vitest watch
npm run test:run         # vitest single run (CI)
npm run db:types         # regenera database.types.ts
npm run db:migration:new # nova migration SQL
npm run db:migrate       # aplica migrations no Supabase remoto
npm run db:functions     # serve Edge Functions local (invite-user, update-user)
npm run tunnel           # ngrok → porta 5173 (teste em tablet)
```

## Docs por tema

```
docs/
├── campo/
│   ├── campo-prd.md              # Produto: requisitos, user stories, critérios de aceite
│   └── campo-green-field-tdd.md # Design técnico original (greenfield) — algumas decisões superadas pela impl atual
├── codebase/                     # Estado atual do codebase (as-built)
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── INTEGRATIONS.md
│   ├── SUPABASE_FUNCTIONS.md   # Edge Functions: template, deploy, padrões
│   ├── STACK.md
│   ├── STRUCTURE.md
│   ├── TESTING.md
│   └── CONCERNS.md
```
