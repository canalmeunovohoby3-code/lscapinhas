-- LS Case by LS Celulares
-- Exclusão administrativa de um pedido. A função é SECURITY DEFINER,
-- valida is_admin() e mantém a tabela orders sem DELETE público direto.
-- Os itens e registros de imagens são removidos pelos FKs em cascata.
-- Os arquivos do bucket privado são removidos pela política de Storage admin.

create or replace function public.admin_delete_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.';
  end if;

  delete from public.orders
  where id = p_order_id;

  return found;
end;
$$;

revoke all on function public.admin_delete_order(uuid) from public;
revoke all on function public.admin_delete_order(uuid) from anon, authenticated;
grant execute on function public.admin_delete_order(uuid) to authenticated;
