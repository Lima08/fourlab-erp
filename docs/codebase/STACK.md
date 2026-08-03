# Stack — Fourlab ERP

## Runtime

- React 19 + React DOM
- React Router 7
- TypeScript 6
- Vite 8

## UI

- Tailwind CSS 4
- Base UI (`@base-ui/react`)
- CVA + `clsx` + `tailwind-merge`
- Sonner (toasts)
- Fontes: Geist Variable, Public Sans, Material Symbols

## Backend / dados

- Supabase JS (`@supabase/supabase-js`)
- TanStack Query 5
- Zustand (auth store)
- Zod (validação de forms)

## PWA / deploy

- `vite-plugin-pwa` + Workbox
- Cloudflare Workers via Wrangler (`fourlab-erp`, `*.workers.dev`)
- Manifest: `display: standalone`, `start_url: /`

## Testes / qualidade

- Vitest + Testing Library + jsdom
- ESLint + Prettier + Husky
- Playwright (disponível; E2E ainda não é o foco do shell)

## Removido desta base

- Dexie / IndexedDB offline
- Sync queue / drain
- `@react-pdf/renderer`, `browser-image-compression`

## Notas de host

- **SPA fallback obrigatório:** servir `index.html` em qualquer rota (Wrangler `not_found_handling: single-page-application`).
- HTTPS necessário para PWA / Service Worker.
