# Tech Stack

**Analisado:** 2026-06-14

## Core

- Framework: React 19.2
- Language: TypeScript 6.0
- Runtime: Browser (PWA)
- Package manager: npm
- Build: Vite 8

## Frontend

- UI Framework: React 19 + Base UI 1.5 (headless primitives)
- Styling: Tailwind CSS 4 (Vite plugin), CVA (class-variance-authority), tailwind-merge, clsx
- State Management: Zustand 5 (auth store), TanStack Query 5 (server state), Dexie live queries (local state)
- Form Handling: estado local com `useState` / `useMemo` — sem biblioteca de forms
- Routing: React Router 7 (browser router, lazy chunks)
- Icons: Material Symbols Outlined (fontsource), Lucide React
- Fonts: Geist Variable, Public Sans
- Toasts: Sonner 2
- Temas: next-themes

## Offline / Local DB

- IndexedDB ORM: Dexie 4 + dexie-react-hooks 4 (live queries reativas)
- Banco local: `VistoriaDB` (IndexedDB), schema versionado (v1 → v2)

## Backend (Supabase)

- API Style: REST via `@supabase/supabase-js` 2
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth (session tokens, onAuthStateChange)
- Storage: Supabase Storage (bucket `evidence` para fotos/vídeos)
- Schema: tabela `project_sync_state` para detecção de updates remotos

## PWA

- Plugin: vite-plugin-pwa 1.3 (Workbox, autoUpdate)
- Cache: CacheFirst para assets `/campo/*`
- Manifest: `display: standalone`, start_url `/campo`

## Testing

- Unit/Integration: Vitest 4 + jsdom + @testing-library/react 16
- Matchers: @testing-library/jest-dom 6
- IndexedDB mock: fake-indexeddb 6
- E2E: @playwright/test 1.60 (instalado, sem testes escritos)
- Supabase mock: `vi.mock('@/shared/db/supabase')`

## External Services

- Backend/DB: Supabase (projeto `wmqbpkytypriizocerdq`)
- Tunnel dev: ngrok (via `npm run tunnel`)

## Development Tools

- Linter: ESLint 10 + eslint-plugin-react-hooks + eslint-plugin-react-refresh + typescript-eslint
- Formatter: Prettier 3
- CLI Supabase: supabase 2 (migrations, type gen)
- Alias de path: `@` → `src/`
- Chunking manual: vendor-react, vendor-router, vendor-db, vendor-supabase, vendor-ui

## Build e Deploy

```bash
npm run build      # dist/ estático (tsc -b && vite build)
npm run preview    # valida build local com Service Worker ativo
```

- `dist/` = 100% estático → qualquer CDN (Netlify, Vercel, Cloudflare Pages, Nginx).
- **SPA fallback obrigatório:** host deve servir `index.html` em qualquer rota — sem isso, refresh em `/campo/...` retorna 404.
- **HTTPS obrigatório** para PWA/Service Worker (exceto `localhost`).
- `index.html` sem cache agressivo (SW gerencia atualização); assets com hash → cache longo.
- Definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas envs do host de build.
