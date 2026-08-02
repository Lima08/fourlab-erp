-- Edge Functions invite-user / update-user usam createSupabaseAdmin() (service_role).
-- A migration remota 20260724173730 revogou SELECT/INSERT/UPDATE em profiles e clients
-- para service_role; isso faz assertAdmin falhar com "permission denied for table profiles".

GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;
GRANT SELECT ON public.clients TO service_role;
