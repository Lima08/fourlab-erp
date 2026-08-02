# Testing

## Gate — obrigatório antes de fechar qualquer task

```bash
npx tsc --noEmit && npm run lint && npm run build
npx prettier --check .   # se falhar: npx prettier --write .
npm run test:run
```

Qualquer falha: **não sobe, não fecha task.**

---

## Frameworks

| Camada            | Ferramenta                                                |
| ----------------- | --------------------------------------------------------- |
| Unit / Integração | Vitest 4 + jsdom + @testing-library/react 16 + jest-dom 6 |
| IndexedDB         | fake-indexeddb 6 (global em `src/test/setup.ts`)          |
| E2E               | @playwright/test 1.60 — instalado, sem testes escritos    |
| Coverage          | não configurado                                           |

**Comandos:**

```bash
npm run test        # vitest watch
npm run test:run    # single run (CI)
npm run e2e         # playwright (quando tiver testes)
npm run e2e:ui      # playwright UI
```

---

## Pirâmide

```
      [E2E]        ← poucos, fluxos críticos no browser real
   [Integração]    ← módulos reais juntos, Dexie em memória, Supabase mockado
  [Unit]           ← lógica pura, sem banco/rede/browser
[Estática]         ← sempre automático: tsc + eslint + prettier + build
```

---

## Setup global (`src/test/setup.ts`)

```ts
import '@testing-library/jest-dom/vitest'
import { indexedDB, IDBKeyRange } from 'fake-indexeddb'
Object.assign(globalThis, { indexedDB, IDBKeyRange })
```

Habilita Dexie em jsdom sem backend real. Nenhum setup adicional por arquivo.

---

## Naming / localização

| Sufixo                   | Quando usar                                      |
| ------------------------ | ------------------------------------------------ |
| `.test.ts` / `.test.tsx` | Unit e component — ao lado do arquivo que testam |
| `.integration.test.ts`   | Toca Dexie ou múltiplos módulos                  |
| `.local.test.ts`         | Lógica local sem rede                            |

---

## 1. Estática

TypeScript + ESLint + Prettier + build. Cobre: tipos errados, imports quebrados, formatação.
Não escrever nada — só rodar o gate.

---

## 2. Unit

**O quê:** lógica pura. Função entra, resultado sai.

**Abordagem:** extrair e testar lógica diretamente — sem `renderHook`. Hook `useProjects` não é testado via render; lógica de filtro é extraída como função pura.

**Exemplos reais:**

- `src/campo/hooks/useProjects.test.ts` — filtro/contagens extraídos como funções puras
- `src/campo/utils/inspectionStats.test.ts` — funções puras testadas diretamente
- `src/shared/utils/lazyWithRetry.test.tsx`

**Padrões:**

- Isole dependências externas com mocks/stubs
- Entradas e saídas determinísticas
- Sem rede, banco ou browser
- Descrições `describe/it/test` em **PT-BR**; identificadores de código e termos de API em inglês

---

## 3. Integração

**O quê:** dois ou mais módulos reais juntos (ex.: queueProcessor + Dexie).

**Quando:** lógica atravessa mais de uma camada (service → Dexie → derivação de estado).

**Setup por arquivo:**

```ts
// vi.mock no topo
vi.mock('@/shared/db/supabase', () => ({ supabase: { from: vi.fn() } }))
vi.mock('@/shared/stores/authStore') // quando necessário

// isolamento entre testes
beforeEach(async () => {
  await db.delete()
  await db.open()
})
```

**Exemplos reais:**

- `src/shared/services/sync/syncService.integration.test.ts`
- `src/shared/services/sync/drainQueue.integration.test.ts`
- `src/campo/hooks/useProjectSyncState.integration.test.ts`

**Padrões:**

- Limpe Dexie entre execuções com `db.delete()` + `db.open()` no `beforeEach`
- Valide contratos entre módulos e persistência
- Dados determinísticos e isolados
- Sem fluxos de UI completos
- Descrições em **PT-BR**

---

## 4. Component

**O quê:** render de componente React com queries semânticas.

**Exemplos reais:** `ProjectInfoSection.test.tsx`, `ProjectInspectionStatus.test.tsx`, `ProjectOptionsMenu.test.tsx`

---

## 5. E2E (Playwright — pendente)

**O quê:** fluxos completos no browser real. Inclui offline, sync, PDF.

**Quando:** só fluxos críticos do MVP.

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173', headless: true },
})
```

**Padrões:** seletores estáveis, dados determinísticos, simule offline quando necessário, não teste lógica que pertence a unit/integração.

---

## Coverage matrix (as-built)

| Camada                                     | Tipo                        | Localização             |
| ------------------------------------------ | --------------------------- | ----------------------- |
| Utils puras (inspectionStats, mappers)       | Unit                        | `*.test.ts` ao lado     |
| Hooks — lógica extraída (filter, counts)   | Unit                        | `*.test.ts` ao lado     |
| Sync service (download, pull, queue drain) | Integration                 | `*.integration.test.ts` |
| Componentes React                          | Component (Testing Library) | `*.test.tsx` ao lado    |
| Lazy loading/retry                         | Unit                        | `*.test.tsx` ao lado    |
| Fluxos E2E                                 | — nenhum ainda —            | —                       |

---

## Parallelism

| Tipo                        | Parallel-safe? | Isolation                                   |
| --------------------------- | -------------- | ------------------------------------------- |
| Unit (lógica pura)          | Sim            | Sem estado compartilhado                    |
| Integration (Dexie)         | Sim\*          | `db.delete()` + `db.open()` no `beforeEach` |
| Component (Testing Library) | Sim            | JSDOM isolado por worker Vitest             |

\*`beforeEach` deve fazer `db.delete() + db.open()` — não apenas `new VistoriaDB()`.

---

## O que testar onde

| Lógica                                            | Onde       |
| ------------------------------------------------- | ---------- |
| `podeEncerrar(itens)`, `calcularProgresso(itens)` | Unit       |
| Validação de schema Zod                           | Unit       |
| Mapeamento Supabase ↔ Dexie                       | Unit       |
| Backoff da sync-queue                             | Unit       |
| Download/pull projeto + Dexie                     | Integração |
| Item offline aparece após sync                    | Integração |
| Queue drain com retry                             | Integração |
| Vistoria offline + bloqueio de encerramento       | E2E        |
| Sync ao reconectar                                | E2E        |
| PDF com irregularidade                            | E2E        |

---

## Validação PWA / offline

SW **não funciona fielmente em `npm run dev`**. Sempre:

```bash
npm run build && npm run preview
```

Checklist DevTools:

- **Application → Manifest:** sem erros, `display: standalone`.
- **Application → Service Workers:** `activated` + `running`.
- **Application → IndexedDB → VistoriaDB:** dados presentes.
- **Network → Offline:** app abre, vistoria funciona.
- Offline → `SyncStatusBadge` muda em ≤ 3s.

Instalação no tablet:

- Android Chrome: menu → "Instalar app".
- iPad Safari: Compartilhar → "Adicionar à Tela de Início".

---

## Fixtures

```
fixtures/
  pt-exemplo.pdf    ← PT simples, 1 sistema (hidrante)
  pt-complexo.pdf   ← múltiplos sistemas e andares
  iptu-exemplo.pdf  ← edificações < 750m²
```

Dados determinísticos. Nunca dados reais de clientes.

---

## CI

```yaml
- name: Estática
  run: npx tsc --noEmit && npm run lint && npm run build

- name: Unit + Integração
  run: npm run test:run

- name: E2E
  run: npm run e2e # por último — mais lento
```
