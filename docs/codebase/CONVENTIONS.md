# Code Conventions

## Naming Conventions

**Files:**

- Componentes React: PascalCase + `.tsx` → `ProjectCard.tsx`, `ItemEditModal.tsx`
- Hooks: camelCase + `.ts`, prefixo `use` → `useProjects.ts`, `useItemEdit.ts`
- Utils/services: camelCase + `.ts` → `inspectionStats.ts`, `syncService.ts`, `mappers.ts`
- Testes: mesma base + `.test.ts` / `.integration.test.ts` / `.local.test.ts`
- Stores: camelCase + `Store.ts` → `authStore.ts`
- Types: `database.types.ts` (gerado), `dexie.ts` (manual)

**Componentes:** Named exports (sem default export em componentes)

```ts
export function ProjectCard({ project }: Props) { ... }
```

**Hooks:** Named exports, sempre prefixo `use`

```ts
export function useProjects(search?, status?, downloadState?) { ... }
```

**Interfaces/Types:**

- `interface` para formas de objetos → `ItemEditForm`, `UseItemEditResult`
- `type` para unions/aliases → `ItemStatus`, `SyncState`, `DownloadState`

**Props:** Interface local `Props` (sem exportar)

```ts
interface Props {
  project: Project
  isOnline: boolean
}
```

**Constantes de módulo:** SCREAMING_SNAKE_CASE

```ts
const RAIL_COLOR: Record<string, string> = { pending: 'bg-red-500', ... }
```

## Code Organization

**Import ordering (observado):**

1. React e libs externas
2. Aliases `@/shared/...`
3. Aliases `@/campo/...` ou `@/components/...`
4. Imports relativos

**Estrutura interna de hook:**

1. Seletores de store (`useAuthStore`)
2. `useState` local
3. `useLiveQuery` / `useEffect`
4. `useMemo` derivado
5. Handlers
6. Return object

**Estrutura interna de componente:**

1. Computed locais
2. JSX (sem sub-funções dentro do componente)

## Type Safety

- Strict TypeScript (sem `any` explícito)
- `satisfies` para garantia de tipo sem widening → `return 'synced' satisfies SyncState`
- Cast explícito quando necessário: `category as ItemCategory`
- Tipos gerados pelo Supabase CLI em `database.types.ts`, usados via `Tables<'tableName'>`

## Styling

- Tailwind CSS classes diretamente no JSX
- `cn()` (clsx + tailwind-merge) para classes condicionais
- CVA para variantes de componente

```ts
const cardVariants = cva('base-classes', { variants: { ... } })
cn(cardVariants({ cardType: project.downloadState }), extraClasses)
```

- Design token customizado: `industrial-*` palette (não é Tailwind padrão)
- Preferir classes canônicas do Tailwind (diagnóstico `suggestCanonicalClasses`). Ex.: usar `wrap-break-word`, **não** `break-words` — mesmo efeito (`overflow-wrap: break-word`), nome canônico do utilitário.
- Botões de ação no **campo** (tablet/mobile): usar `Button` com `size="touch"` (h-12, modais/forms) ou `size="touch-lg"` (h-14, CTA de card). Evitar o `size` default (h-8) em CTAs — é pequeno demais para touch.

### Motion (campo — usabilidade)

Motion CSS-only (`tw-animate-css` + utilities em `index.css`). Sem framer-motion. ≤220ms. Preferir `active:` a `hover:`. `prefers-reduced-motion` já zera animações globalmente.

Momentos permitidos (só feedback de ação/estado):

1. **Toque** — `active:scale-95` / `active:scale-[0.98]` em CTAs e cards clicáveis
2. **Troca de rota** — `animate-fade-slide-in` no conteúdo do layout
3. **Filtro/lista** — `animate-fade-slide-in` no remount intencional (key de filtro), nunca em cada update Dexie
4. **Conectividade / sync** — `animate-state-pulse` + `transition-colors` no badge/rail
5. **Status de item** — `transition-colors` no select/botões de status
6. **Overlays** — reusar `animate-in`/`animate-out` dos primitivos `dialog`/`menu`

## Error Handling

- Funções assíncronas de serviço retornam `SyncResult = { success: true } | { success: false; error: string }`
- Handlers em hooks: `try/catch` com `toast.error(...)` via Sonner
- Falhas de sync: toast persistente com ação "Descartar"
- Sem re-throw para o caller — erros são tratados localmente

## State Mutation Pattern

- Escrita sempre local-first (Dexie) → depois enqueue para Supabase
- Nunca escrever diretamente no Supabase sem passar pela fila
- `recomputeProjectProgress()` chamado após qualquer mutação de item

## Comments

Mínimos. Apenas quando o porquê não é óbvio:

```ts
// buscar client associado (best-effort — falha silenciosa)
// Merge item seed + user changes — no useEffect seeding needed
```

## Language

Regra obrigatória para código novo e refactors: **padronizar identificadores em inglês**.

| Camada | Idioma |
| ------ | ------ |
| Nomes de **arquivos** e **pastas** de código novo | Inglês |
| **Funções**, **métodos**, **hooks** exportados | Inglês |
| **Tipos**, **interfaces**, **enums** TypeScript | Inglês |
| **Constantes** exportadas (`SCREAMING_SNAKE_CASE`) | Inglês |
| Strings de UI, labels, toasts | Português (pt-BR) |
| Descrições de teste (`describe`/`it`) | Português |
| Commits e PRs | Inglês |

Ao criar ou renomear código, preferir inglês mesmo dentro de módulos com path em português (`src/campo/components/projetos/` → arquivo `InspectionPage.tsx`, não `VistoriaPage.tsx`).

### Identificadores em inglês — exemplos

| ✅ Inglês | ❌ Português |
| --------- | ------------ |
| `InspectionPage.tsx`, `UsersPage.tsx` | `VistoriaPage.tsx`, `UsuariosPage.tsx` |
| `FieldLayout`, `PlatformGuard` | `CampoLayout`, `PlataformaGuard` |
| `inspectionStats.ts`, `toggleInspectionFilter()` | `vistoriaStats.ts`, `toggleVistoriaFilter()` |
| `userFormSchema`, `UserFormValues` | `usuarioFormSchema`, `UsuarioFormValues` |
| `PLATFORM_NAV`, `getPlatformNavItems()` | `PLATAFORMA_NAV`, `getPlataformaNavItems()` |
| `matchesSearchText()`, `normalizeSearchText()` | `correspondeTextoBusca()` (não inventar PT) |

**Exceções intencionais (não renomear sem migration/plano explícito):**

- **Rotas públicas** (`/campo`, `/ativar-conta`, `/plataforma/usuarios`) — URLs e slugs em PT-BR
- **Pastas de módulo** (`src/campo/`, `src/plataforma/`) — aliases `@/campo`, `@/plataforma`
- **Literais de enum do Postgres** (`'cliente'`, `'ativo'`, `'convite_pendente'`) — espelham `database.types.ts`
- **Subpastas legadas** (`projetos/`, `usuarios/`, `detalhes/`, `localizacao/`) — renomear só em refactor dedicado; **arquivos novos** dentro delas ainda em inglês
- **`VistoriaDB`** — nome persistido no IndexedDB de dispositivos em campo

## TypeScript — Config

- Strict mode. Sem `any` implícito.
- `noUncheckedIndexedAccess` ligado — acesso a array/record sempre com checagem de undefined.
- `import type` quando for apenas tipo: `import type { Tables } from '@/shared/db/database.types'`
- `@/` sempre para alias de import — nunca paths relativos entre módulos distantes.

## Prettier

```
sem ponto-e-vírgula, aspas simples, 2 espaços, trailingComma: es5
```

## Estado — onde vive o quê

| Tipo de estado                          | Onde                   |
| --------------------------------------- | ---------------------- |
| UI efêmera (modais, loading, seleção)   | Zustand                |
| Dados locais reativos (projetos, itens) | `useLiveQuery` (Dexie) |
| Cache de servidor / mutations           | TanStack Query         |

## Armadilhas

- ❌ UI espera rede. ✅ Lê Dexie; rede é async em background.
- ❌ Dexie dentro de `components/ui/`. ✅ Só em hooks de `campo/` ou `shared/`.
- ❌ Escrever direto no Supabase. ✅ Dexie primeiro → `enqueue*()` → drain.
- ❌ Foto sem comprimir. ✅ `browser-image-compression` antes de `db.evidence.add()`.
- ❌ Bloquear vistoria por quota cheia. ✅ Avisar sem interromper.
- ❌ Fontes/ícones via CDN. ✅ Empacotar local (`@fontsource`).
- ❌ Cachear endpoints autenticados no SW. ✅ Dados no Dexie + `syncQueue`.
- ❌ Identificador em português. ✅ Inglês para arquivos/funções/tipos/constantes exportadas (ver CONVENTIONS § Language).
