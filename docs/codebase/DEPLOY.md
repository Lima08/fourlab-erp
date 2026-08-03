# Deploy — Fourlab ERP

## Cloudflare Workers

- Conta: `17b539467cc4a4060f92786c815d023e` (Jplima08.dev@gmail.com)
- Worker: `fourlab-erp` (`wrangler.jsonc` → `name`)
- URL produção: `https://fourlab-erp.jplima08-dev.workers.dev`
- Config: `wrangler.jsonc` (`not_found_handling: single-page-application`)
- Build: Vite + `@cloudflare/vite-plugin` → `dist/wrangler.json`

**Importante:** ative o toggle do subdomain `workers.dev` em Domains do Worker; sem isso a URL não fica pública.

## Deploy: Workers Builds (dashboard)

GitHub conectado em Workers & Pages → `fourlab-erp`. Deploy sobe por lá — **não** pelo GitHub Actions.

| Campo | Valor |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

### Build variables (Cloudflare)

| Nome | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | Build |
| `VITE_SUPABASE_ANON_KEY` | Build |
| `VITE_VIA_CEP_URL` | Build (opcional; ver `.env.example`) |
| `VITE_FEATURE_FLAG_USER_MANAGEMENT` | Build (opcional) |

## CI: GitHub Actions (só gate)

Workflow: `.github/workflows/ci.yml` — typecheck, lint, test e build em PR / `workflow_dispatch`. Sem step de deploy.

### Secrets no Environment `development` (build do gate)

| Nome | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | Build |
| `VITE_SUPABASE_ANON_KEY` | Build |
| `VITE_FEATURE_FLAG_USER_MANAGEMENT` | Build (opcional) |
| `VITE_VIA_CEP_URL` | Build (opcional) |

`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` não são necessários no Actions (deploy é só no Cloudflare).

## Local

```bash
npm run build
npm run preview   # wrangler dev sobre dist
# ou
npm run deploy
```

## SPA fallback

Refresh em `/inicio` (ou qualquer rota client-side) deve servir `index.html` — já configurado no Wrangler.
