-- LS Case by LS Celulares
-- Etapa 1E: proteção simplificada contra abuso na criação de pedidos.
--
-- A criação de pedidos passa a ser feita exclusivamente pela Edge Function
-- create-order, que valida Cloudflare Turnstile no servidor e aplica rate limit
-- antes de chamar public.create_custom_order com a service_role.
--
-- Esta migração é incremental e não altera a migração inicial já aplicada.

revoke execute on function public.create_custom_order(text, text, text, jsonb)
  from anon, authenticated;

grant execute on function public.create_custom_order(text, text, text, jsonb)
  to service_role;

create table if not exists public.order_rate_limits (
  client_key text not null check (char_length(client_key) between 16 and 128),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (client_key, window_start)
);

create index if not exists order_rate_limits_window_idx
  on public.order_rate_limits (window_start);

alter table public.order_rate_limits enable row level security;

revoke all on table public.order_rate_limits from public, anon, authenticated;

create or replace function public.consume_order_rate_limit(
  p_client_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_client_key is null
    or char_length(p_client_key) < 16
    or char_length(p_client_key) > 128
  then
    raise exception 'Chave de rate limit inválida.';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Limite de rate limit inválido.';
  end if;

  if p_window_seconds is null
    or p_window_seconds < 1
    or p_window_seconds > 3600
  then
    raise exception 'Janela de rate limit inválida.';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.order_rate_limits (client_key, window_start, request_count)
  values (p_client_key, v_window_start, 1)
  on conflict (client_key, window_start) do update
    set request_count = public.order_rate_limits.request_count + 1
    where public.order_rate_limits.request_count < p_limit
  returning request_count into v_count;

  if v_count is null then
    return false;
  end if;

  delete from public.order_rate_limits
  where window_start < now() - interval '1 day';

  return true;
end;
$$;

revoke all on function public.consume_order_rate_limit(text, integer, integer)
  from public;
revoke all on function public.consume_order_rate_limit(text, integer, integer)
  from anon, authenticated;
grant execute on function public.consume_order_rate_limit(text, integer, integer)
  to service_role;
