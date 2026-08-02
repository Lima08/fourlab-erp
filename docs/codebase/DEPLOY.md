# Deploy — Fourlab ERP

## Cloudflare Pages

- Projeto (fallback CI): `fourlab-erp`
- Config: `wrangler.jsonc` (`not_found_handling: single-page-application`)
- Workflow: `.github/workflows/ci.yml` (gate em PR; deploy via `workflow_dispatch`)

## Variáveis GitHub Environment `development`

| Nome | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | Build |
| `VITE_SUPABASE_ANON_KEY` | Build |
| `VITE_FEATURE_FLAG_USER_MANAGEMENT` | Build (opcional) |
| `CLOUDFLARE_API_TOKEN` | Deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Override do nome do projeto Pages |

## Local

```bash
npm run build
npm run preview   # wrangler dev sobre dist
# ou
npm run deploy
```

## SPA fallback

Refresh em `/inicio` (ou qualquer rota client-side) deve servir `index.html` — já configurado no Wrangler.
