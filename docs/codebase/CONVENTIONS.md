# Conventions — Fourlab ERP

## Language

- **Código** (arquivos, funções, tipos, constantes exportadas): inglês.
- **UI / toasts / copy**: PT-BR.
- **Rotas públicas**: PT-BR (`/inicio`, `/ativar-conta`, `/recuperar-senha`).

| Preferir | Evitar |
| --- | --- |
| `HomePage.tsx`, `UsersPage.tsx` | `InicioPage.tsx`, `UsuariosPage.tsx` |
| `userFormSchema`, `getAuthHomePath` | `usuarioFormSchema`, `obterHomeAuth` |

## Módulos

- `components/ui/` — primitivos puros; sem Supabase, sem store, sem domínio.
- `shared/` — infra; domínio de produto vive em `app/` (e módulos futuros).
- Componentes de UI recebem dados/handlers via props.

## Mobile-first

UI e fluxos novos partem do mobile; desktop é progressive enhancement.

- **Viewport base:** projetar e validar em ~375px de largura antes de `md+`.
- **Touch targets:** controles acionáveis com área confortável ao toque (evitar hit areas minúsculas).
- **Formulários:** páginas dedicadas para criar/editar (não sheets longos no MVP), com hierarquia escaneável no celular.
- **Navegação de módulos:** bottom nav no mobile; sidebar colapsável no body a partir de `md` (módulos não ficam no header).
- **Layout:** progressive enhancement com breakpoints Tailwind (`md+`); não assumir hover como único affordance.
- **Checagem:** antes de considerar uma tela pronta, revisar no viewport estreito (DevTools ou device).

## Supabase

- Nunca expor `service_role` no front.
- `database.types.ts` é gerado (`npm run db:types`) — não editar à mão.
- Mutações de domínio: client anon + RLS; admin sensível via Edge Functions.

## Imports

1. Pacotes externos
2. `@/shared/...`, `@/app/...`, `@/auth/...`
3. `@/components/...`
4. Relativos locais

## Testes

- Descrições `describe` / `it` em PT-BR.
- Mockar `@/shared/db/supabase` nos unitários que tocam auth/DB.

## Commits

Conventional commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
