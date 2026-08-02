# Supabase Functions — Fourlab ERP

## Quando usar Edge Function

| Caso | Caminho |
| --- | --- |
| Convite / update de usuário (service role) | Edge Function |
| CRUD de domínio autenticado do usuário | Supabase client (anon + RLS) no front |

## Functions atuais

- `invite-user` — cria usuário + profile pendente
- `update-user` — atualiza profile/admin fields

Shared: `supabase/functions/_shared/`

## Padrões

1. Validar JWT do caller (admin).
2. Usar service role só no Deno runtime da function.
3. UI/services no front consomem via `supabase.functions.invoke` encapsulado em `shared/services/*`.
4. Zero lógica de invoke dentro de `components/ui/`.

## Local

```bash
npm run db:functions
```

## Deploy

Seguir checklist do projeto Supabase / CLI (`supabase functions deploy …`).
