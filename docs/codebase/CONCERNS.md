# Concerns — Fourlab ERP

## Ativos

### Schema legado no remoto

- O projeto Supabase ainda pode conter tabelas do produto anterior (projetos, locais, itens, evidências).
- O front desta base **não** as consome; auth + `profiles` + módulo `customers`.
- Próxima fase: aplicar baseline ERP no remoto e limpeza do schema órfão.

### Gestão de usuários sem UI

- Edge Functions `invite-user` / `update-user` e services `profileAdmin*` / `profileEdge*` permanecem.
- Não há tela de administração no shell; reintroduzir com o módulo de usuários/admin do ERP.

### Feature flag

- `VITE_FEATURE_FLAG_USER_MANAGEMENT` ainda existe; sem UI de usuários no shell o impacto é baixo.

## Resolvidos nesta limpeza

- Domínio offline (IndexedDB/sync) removido do front.
- Branding e módulos do produto anterior removidos.
- Shell autenticado (`src/app/`) com home e navegação de módulos.
- **Roles legados:** front e Edge alinhados ao baseline `profiles` sem `role`/`cliente`; convite via `is_active`.
- Módulo **Clientes** (`src/app/customers/`) com CRUD PF/PJ e pedidos read-only na ficha.
