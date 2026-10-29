-- LS Case by LS Celulares
-- Hardening incremental: remove o EXECUTE desnecessário de anon em is_admin().
-- A função continua disponível para authenticated (políticas administrativas) e
-- service_role. A migração inicial já aplicada não é alterada.
--
-- touch_updated_at() é uma função de trigger SECURITY INVOKER, sem acesso a
-- tabelas; não é revogada aqui para não arriscar o trigger legítimo.

revoke execute on function public.is_admin() from anon;
