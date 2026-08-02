# Supabase Edge Functions

Guia para criar e manter Edge Functions no projeto. Runtime **Deno**; código em `supabase/functions/`.

## Quando usar

| Cenário | Abordagem |
| -------- | --------- |
| CRUD de vistoria (projeto, item, evidência) | Dexie → sync queue → Supabase client (anon key + RLS). **Nunca** Edge Function. |
| Operação que exige `service_role` (Auth Admin API, bypass RLS controlado) | Edge Function + `createSupabaseAdmin()` |
| Validação de permissão além do RLS (ex.: só `admin`) | Edge Function + `assertAdmin()` |

Functions existentes: **`invite-user`**, **`update-user`** (administração de usuários da plataforma).

---

## Estrutura de pastas

```
supabase/functions/
├── _shared/                  # Helpers reutilizáveis — importar com extensão .ts
│   ├── assertAdmin.ts        # Valida JWT + role admin em profiles
│   ├── cors.ts               # CORS preflight + jsonResponse()
│   ├── errors.ts             # EdgeError + handleEdgeError()
│   └── supabaseAdmin.ts      # Client service_role (nunca expor no front)
├── invite-user/
│   └── index.ts              # Uma pasta = uma function deployável
└── update-user/
    └── index.ts
```

**Regra:** código compartilhado só em `_shared/`. Cada function tem pasta própria com `index.ts` na raiz.

---

## Template de handler

Seguir esta ordem em toda function nova:

```ts
import { z } from 'npm:zod@3.24.1'
import { assertAdmin } from '../_shared/assertAdmin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { EdgeError, handleEdgeError } from '../_shared/errors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

const bodySchema = z.object({
  // campos em camelCase — espelham o payload do front
})

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)
  }

  try {
    const adminClient = createSupabaseAdmin()
    await assertAdmin(req, adminClient) // omitir se auth for diferente

    const rawBody = await req.json()
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new EdgeError('VALIDATION_ERROR', 400, 'Dados inválidos')
    }

    // lógica de negócio...

    return jsonResponse({ ok: true })
  } catch (error) {
    return handleEdgeError(error)
  }
})
```

### Convenções do handler

1. **Só POST** — invocação via `supabase.functions.invoke(name, { body })`.
2. **CORS primeiro** — `handleCors` trata `OPTIONS`; demais métodos seguem.
3. **Validação com Zod** — import `npm:zod@3.24.1` (padrão Deno do Supabase).
4. **Erros tipados** — `throw new EdgeError(code, status, message)` para respostas previsíveis.
5. **Resposta JSON** — sempre `jsonResponse(body, status?)`; inclui headers CORS.
6. **Imports com `.ts`** — ex.: `'../_shared/cors.ts'`.
7. **Supabase client** — `@supabase/supabase-js@2` via `https://esm.sh/@supabase/supabase-js@2` em `_shared` apenas.

---

## Autenticação e autorização

### `assertAdmin(req, adminClient)`

1. Lê `Authorization: Bearer <jwt>` (JWT do usuário logado no front).
2. Valida token via `adminClient.auth.getUser(token)`.
3. Confere `profiles.role === 'admin'`.
4. Lança `EdgeError('NOT_ADMIN', 403, ...)` se falhar.

`verify_jwt = true` em `config.toml` garante que requests sem JWT válido são rejeitados antes do handler; `assertAdmin` adiciona checagem de **role**.

Para functions com regra de auth diferente, criar helper em `_shared/` (ex.: `assertAuthenticated.ts`) — não duplicar lógica inline.

---

## Erros — contrato front ↔ function

Resposta de erro:

```json
{ "error": "Mensagem legível", "code": "EMAIL_EXISTS" }
```

| `code` | HTTP | Uso |
| ------ | ---- | --- |
| `VALIDATION_ERROR` | 400 | Body Zod inválido ou regra de negócio |
| `NOT_FOUND` | 404 | Recurso inexistente |
| `NOT_ADMIN` | 403 | Sem permissão |
| `EMAIL_EXISTS` | 409 | E-mail duplicado |
| `INVALID_STATUS` | 400 | Estado inconsistente (ex.: reenviar convite) |
| `LAST_ADMIN` | 400 | Proteção do último admin |
| `METHOD_NOT_ALLOWED` | 405 | Método HTTP não suportado |
| `INTERNAL` | 500 | Fallback em `handleEdgeError` |

Erros desconhecidos → log no servidor + `INTERNAL` genérico (não vazar stack).

---

## Integração no front

Functions da plataforma são chamadas via service dedicado — **não** chamar `supabase.functions.invoke` direto em componentes.

**Padrão:** `src/shared/services/profileEdgeService.ts`

```ts
// 1. Tipos de payload exportados
// 2. invokeEdgeFunction<T>() — parse de erro, mapEdgeErrorMessage()
// 3. Funções públicas: inviteUser(), updateUser(), resendInvite()
// 4. Retorno: EdgeResult<T> = { success: true, data } | { success: false, error, code? }
```

Ao criar function nova:

1. Adicionar função export em `*EdgeService.ts` (ou criar service se domínio for outro).
2. Mapear códigos novos em `ERROR_MESSAGES`.
3. Testes em `profileEdgeService.test.ts` (mock de `supabase.functions.invoke`).
4. UI em `src/plataforma/` consome o service — zero lógica de invoke em componente.

---

## Configuração

### `supabase/config.toml`

Registrar cada function:

```toml
[functions.minha-function]
verify_jwt = true   # false só se endpoint for público (raro)
```

### Secrets (projeto remoto)

Injetados automaticamente pelo Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Configurar manualmente:

```bash
supabase secrets set SITE_URL=https://<dominio-producao>
```

`SITE_URL` — redirect de e-mails Auth (convite, reset). Ver `.env.example`.

Dev local: `supabase/.env.local` (não commitar) + `--env-file` no serve.

### `package.json`

```bash
npm run db:functions   # supabase functions serve invite-user update-user ...
```

Ao adicionar function, incluir o nome no script `db:functions`.

---

## Deploy

```bash
supabase functions deploy nome-da-function
```

Deploy de todas de uma vez:

```bash
supabase functions deploy invite-user
supabase functions deploy update-user
```

Projeto linkado: `npm run db:link` (ref em `config.toml`: `wmqbpkytypriizocerdq`).

---

## Permissões Postgres (service_role)

Functions que usam `createSupabaseAdmin()` operam como `service_role`. Se uma migration revogar GRANTs, a function quebra com `permission denied`.

**Ao tocar tabelas novas na function:** criar migration SQL concedendo o mínimo necessário:

```sql
-- Exemplo existente: supabase/migrations/20260729185956_edge_functions_service_role_grants.sql
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;
GRANT SELECT ON public.clients TO service_role;
```

Preferir grants explícitos a desabilitar RLS. Documentar na migration **qual function** precisa do grant.

---

## Checklist — nova Edge Function

- [ ] Pasta `supabase/functions/<nome>/index.ts` seguindo o template.
- [ ] Reutilizar `_shared/` (cors, errors, supabaseAdmin; assertAdmin ou helper novo).
- [ ] Schema Zod + códigos `EdgeError` estáveis.
- [ ] Entrada em `[functions.<nome>]` no `config.toml` (`verify_jwt` correto).
- [ ] Nome adicionado em `db:functions` no `package.json`.
- [ ] Service no front (`src/shared/services/`) + testes com mock de invoke.
- [ ] Migration de GRANTs se usar tabelas novas via service_role.
- [ ] Deploy + smoke test com curl ou UI da plataforma.
- [ ] Secrets (`SITE_URL` etc.) configurados no remoto se a function gera links Auth.

---

## Teste manual (local)

```bash
supabase start
supabase functions serve minha-function --env-file supabase/.env.local
```

```bash
curl -i -X POST http://127.0.0.1:54321/functions/v1/minha-function \
  -H "Authorization: Bearer <jwt_admin>" \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

JWT: login como admin no app local e copiar token da sessão Supabase.

---

## Armadilhas

- ❌ `service_role` key no front ou em `VITE_*`. ✅ Só secrets da Edge Function.
- ❌ Escrever vistoria via function. ✅ Sync queue + RLS.
- ❌ `supabase.functions.invoke` em componente. ✅ Service em `shared/services/`.
- ❌ Esquecer GRANTs após migration restritiva. ✅ Migration dedicada + comentário.
- ❌ Erros sem `code`. ✅ Front mapeia mensagens via `ERROR_MESSAGES`.
- ❌ Import Zod/npm sem versão fixa. ✅ `npm:zod@3.24.1`.
