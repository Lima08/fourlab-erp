# Deploy e Infraestrutura

Guia rápido para o time: onde a app roda, como o CI funciona e como publicar uma versão.

---

## Visão geral

| Peça | Serviço | Papel |
| ---- | ------- | ----- |
| Frontend (PWA) | **Cloudflare Pages** | Serve o `dist/` estático (HTTPS, CDN, SPA fallback) |
| Backend | **Supabase** | Postgres, Auth, Storage |
| CI/CD | **GitHub Actions** | Gate em PRs + deploy **manual** via Run workflow |

**URL de produção:** https://soraia-vistoria.pages.dev

O app é 100% estático após o build. Variáveis `VITE_*` entram no bundle **no momento do build** — não são lidas em runtime no servidor.

---

## Branches

| Branch | Uso | CI (gate) | Deploy |
| ------ | --- | --------- | ------ |
| `main` | Produção | PRs → `main` | Manual (**Run workflow** na branch `main`) |
| `develop` | Integração | PRs → `develop` | Manual (**Run workflow**; preview se não for `main`) |

**Não há deploy automático** em push/merge. Preview **não** é criado para todo PR — só quando alguém dispara o workflow na branch desejada com deploy marcado.

---

## Gate de qualidade (automático)

Arquivo: `.github/workflows/ci.yml`

Roda **somente** em:

- **pull request** cujo base seja `main` ou `develop`
- **Run workflow** (disparo manual)

PRs apontados para outras branches **não** disparam o pipeline.

Passos (na ordem):

1. `npm ci`
2. Typecheck — `npx tsc --noEmit`
3. Lint — `npm run lint`
4. Testes — `npm run test:run`
5. Build — `npm run build`

Se algum passo falhar, o PR fica vermelho. Corrija antes de seguir.

Localmente, o equivalente é:

```bash
npm run gate
```

---

## Deploy (somente manual)

| Trigger | Gate | Deploy |
| ------- | ---- | ------ |
| PR → `main` / `develop` | ✅ | ❌ skipped |
| PR → outras bases | ❌ não roda | — |
| **Run workflow** + deploy ✅ | ✅ | ✅ (`main` = prod, outra = preview) |
| **Run workflow** + deploy ❌ | ✅ | ❌ skipped |

### Como publicar (produção)

1. **Actions** → **CI/CD** → **Run workflow**
2. Branch `main`
3. Deixe **Deploy no Cloudflare Pages** marcado
4. **Run workflow** → espere Gate + Deploy

### Como publicar um preview (branch selecionada)

1. **Actions** → **CI/CD** → **Run workflow**
2. Escolha a **branch** do PR / feature
3. Deixe **Deploy** marcado
4. O Cloudflare Pages publica um preview nessa branch (`--branch=<ref>`)

O job `Deploy Cloudflare Pages` só inicia depois do `Gate` verde. Se o gate falhar, nada é publicado.

### Fluxo recomendado

```
PR → main/develop → gate verde → merge → Run workflow em main (produção)
```

## Para republicar `main` sem commit novo: **Run workflow** na branch `main`.

## O que o Cloudflare Pages precisa no `dist/`

Já versionado no repo e copiado no build:

| Arquivo             | Função                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| `public/_redirects` | SPA fallback — refresh em `/campo/...` não dá 404                            |
| `public/_headers`   | Cache: `index.html` / SW sem cache agressivo; assets com hash em cache longo |

**HTTPS** é obrigatório (PWA / Service Worker). Em local, use `npm run build && npm run preview` para validar offline — `npm run dev` não simula o SW de produção.

---

## Secrets e variáveis (GitHub)

Ficam no **Environment** `development` (não em Repository secrets).

Caminho: **Settings → Environments → development → Environment secrets / variables**.

Os jobs `gate` e `deploy` usam `environment: development` no workflow — sem isso os secrets resolvem vazios e o build/deploy quebra.

Devs comuns não precisam editar; quem administra o repo mantém isso.

### Environment secrets (`development`)

| Nome                     | Para quê                              |
| ------------------------ | ------------------------------------- |
| `VITE_SUPABASE_URL`      | Build do front                        |
| `VITE_SUPABASE_ANON_KEY` | Build do front (nunca `service_role`) |
| `CLOUDFLARE_API_TOKEN`   | Deploy via Wrangler                   |
| `CLOUDFLARE_ACCOUNT_ID`  | Conta Cloudflare                      |

### Environment variables (`development`)

| Nome                            | Valor esperado    | Obrigatório?                                         |
| ------------------------------- | ----------------- | ---------------------------------------------------- |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | `soraia-vistoria` | Não — o workflow usa `soraia-vistoria` como fallback |

Se quiser deixar explícito no painel: **Environments → development → Add variable**.

---

## Checklist do dia a dia

- [ ] Gate verde no PR (base `main` ou `develop`) antes de mergear
- [ ] Produção: **Actions → CI/CD → Run workflow** na branch `main` com deploy marcado
- [ ] Preview: mesmo fluxo, na branch do PR desejado
- [ ] Conferir a URL no Cloudflare Pages / Actions após o deploy
- [ ] Em dúvida de PWA/offline: validar com `npm run build && npm run preview`, não só `dev`

---

## O que **não** fazer

- Não esperar deploy automático no merge — ele não existe de propósito
- Não esperar preview automático em todo PR — só via Run workflow na branch escolhida
- Não deixar o Git integration da Cloudflare gerar preview em todo PR (desconectar/desabilitar)
- Não commitar `.env.local`
- Não usar `service_role` no front
- Não editar `database.types.ts` à mão (`npm run db:types` após migrations)
- Não validar comportamento offline só com `npm run dev`

---

## Referências

| Doc | Conteúdo |
| ---- | ------- |
| `docs/codebase/STACK.md` | Stack e notas de build |
| `docs/codebase/INTEGRATIONS.md` | Supabase, envs, migrations |
| `docs/codebase/TESTING.md`      | Gate e validação PWA       |
| `.github/workflows/ci.yml`      | Pipeline oficial           |
