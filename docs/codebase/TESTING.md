# Testing — Fourlab ERP

## Ferramentas

| Camada | Stack |
| --- | --- |
| Unit / integração | Vitest + Testing Library + jsdom |
| Setup | `src/test/setup.ts` (jest-dom) |
| Gate | `npm run gate` (= tsc + lint + test:run + build) |

## Padrões

- Descrições em PT-BR.
- Mockar `@/shared/db/supabase` e stores quando o teste não precisa de rede real.
- Preferir testar funções puras e comportamento de UI com handlers mockados.

## O que cobrir no shell

- Auth navigation (`getAuthHomePath`, redirects de convite)
- Login (sucesso → `/inicio`, bloqueio convite/suspenso)
- BootSplash branding
- UserMenu logout
- Profile services / Edge (já existentes)

## Offline / PWA

Validar installability com `npm run build && npm run preview` (não só `npm run dev`).
