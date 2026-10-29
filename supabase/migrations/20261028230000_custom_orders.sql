-- LS Case by LS Celulares
-- Etapa 1: infraestrutura de pedidos personalizados.
--
-- Esta migração deve ser aplicada no Supabase (SQL Editor ou `supabase db push`).
-- Ela NÃO é executada pelo navegador e NÃO foi aplicada automaticamente por este
-- projeto, pois ainda não há credenciais/projeto Supabase vinculado.
--
-- Segurança:
-- - O bucket "order-images" é privado.
-- - O público (anon) NÃO recebe SELECT/INSERT/UPDATE/DELETE direto nas tabelas.
-- - Pedidos são criados pelas funções RPC security definer.
-- - O painel administrativo exige usuário autenticado e presença em admin_users.
-- - A chave service_role nunca deve ser usada no frontend nem com prefixo VITE_.

create extension if not exists pgcrypto;

do $$
begin
  create type public.order_status as enum (
    'novo',
    'em_analise',
    'em_producao',
    'pronto',
    'concluido',
    'cancelado'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_name text,
  customer_contact text,
  status public.order_status not null default 'novo',
  notes text
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  brand_id text not null,
  brand_name text not null,
  model_id text not null,
  model_name text not null,
  quantity integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  constraint order_items_order_model_unique unique (order_id, model_id),
  constraint order_items_id_order_unique unique (id, order_id)
);

create table if not exists public.order_images (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid,
  storage_path text not null unique,
  file_name text,
  content_type text,
  size_bytes bigint check (size_bytes is null or size_bytes > 0),
  created_at timestamptz not null default now(),
  constraint order_images_storage_path_check check (
    storage_path ~* '^orders/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-z0-9][a-z0-9._-]*$'
  ),
  constraint order_images_item_order_fk
    foreign key (order_item_id, order_id)
    references public.order_items(id, order_id)
    on delete cascade
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_images_order_idx on public.order_images (order_id);
create index if not exists order_images_item_idx on public.order_images (order_item_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row
execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_images enable row level security;
alter table public.admin_users enable row level security;

-- Não há política pública nas tabelas: anon não lê nem grava diretamente.
-- O admin autenticado e allowlisted pode consultar todos os pedidos.
drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update order status" on public.orders;
create policy "Admins can update order status"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read order images" on public.order_images;
create policy "Admins can read order images"
on public.order_images for select
to authenticated
using (public.is_admin());

revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.order_images from anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;

grant select on table public.orders to authenticated;
grant update (status) on table public.orders to authenticated;
grant select on table public.order_items to authenticated;
grant select on table public.order_images to authenticated;

-- Criação pública de um pedido. O navegador não escreve nas tabelas diretamente.
create or replace function public.create_custom_order(
  p_customer_name text,
  p_customer_contact text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_item_count integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Itens do pedido inválidos.';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 20 then
    raise exception 'O pedido deve ter entre 1 e 20 itens.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(btrim(v_item->>'brandId'), '') = ''
      or coalesce(btrim(v_item->>'brandName'), '') = ''
      or coalesce(btrim(v_item->>'modelId'), '') = ''
      or coalesce(btrim(v_item->>'modelName'), '') = ''
    then
      raise exception 'Marca ou modelo inválido no pedido.';
    end if;

    if coalesce((v_item->>'quantity')::int, 0) < 1
      or (v_item->>'quantity')::int > 99
    then
      raise exception 'Quantidade inválida no pedido.';
    end if;
  end loop;

  insert into public.orders (
    customer_name,
    customer_contact,
    notes,
    status
  )
  values (
    nullif(btrim(coalesce(p_customer_name, '')), ''),
    nullif(btrim(coalesce(p_customer_contact, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    'novo'
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    brand_id,
    brand_name,
    model_id,
    model_name,
    quantity
  )
  select
    v_order_id,
    value->>'brandId',
    value->>'brandName',
    value->>'modelId',
    value->>'modelName',
    sum((value->>'quantity')::int)::int
  from jsonb_array_elements(p_items) as item(value)
  group by
    value->>'brandId',
    value->>'brandName',
    value->>'modelId',
    value->>'modelName';

  return v_order_id;
end;
$$;

revoke all on function public.create_custom_order(text, text, text, jsonb) from public;
grant execute on function public.create_custom_order(text, text, text, jsonb)
  to anon, authenticated;

-- Registra os caminhos das imagens previamente enviadas ao bucket privado.
create or replace function public.attach_order_images(
  p_order_id uuid,
  p_images jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_image jsonb;
  v_path text;
  v_item_id uuid;
begin
  if not exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.status = 'novo'
      and o.created_at > now() - interval '24 hours'
  ) then
    raise exception 'Pedido não encontrado, já processado ou expirado.';
  end if;

  if p_images is null
    or jsonb_typeof(p_images) <> 'array'
    or jsonb_array_length(p_images) < 1
    or jsonb_array_length(p_images) > 12
  then
    raise exception 'Lista de imagens inválida.';
  end if;

  for v_image in select value from jsonb_array_elements(p_images)
  loop
    v_path := btrim(coalesce(v_image->>'path', ''));

    if v_path !~* ('^orders/' || p_order_id::text || '/[a-z0-9][a-z0-9._-]*$') then
      raise exception 'Caminho de imagem inválido para este pedido.';
    end if;

    v_item_id := nullif(v_image->>'itemId', '')::uuid;

    if v_item_id is not null and not exists (
      select 1
      from public.order_items oi
      where oi.id = v_item_id
        and oi.order_id = p_order_id
    ) then
      raise exception 'Item da imagem não pertence ao pedido.';
    end if;

    insert into public.order_images (
      order_id,
      order_item_id,
      storage_path,
      file_name,
      content_type,
      size_bytes
    )
    values (
      p_order_id,
      v_item_id,
      v_path,
      nullif(btrim(coalesce(v_image->>'fileName', '')), ''),
      nullif(btrim(coalesce(v_image->>'contentType', '')), ''),
      nullif((v_image->>'sizeBytes')::bigint, 0)
    )
    on conflict (storage_path) do nothing;
  end loop;
end;
$$;

revoke all on function public.attach_order_images(uuid, jsonb) from public;
grant execute on function public.attach_order_images(uuid, jsonb)
  to anon, authenticated;

-- Bucket privado para as artes enviadas pelo cliente.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'order-images',
  'order-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Função usada pela policy de upload. Confirma que o pedido existe, está novo
-- e foi criado nas últimas 24 horas. O id do pedido é um UUID não sequencial.
create or replace function public.can_upload_order_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when object_name !~* '^orders/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-z0-9][a-z0-9._-]*$'
        then false
      else exists (
        select 1
        from public.orders o
        where o.id = split_part(object_name, '/', 2)::uuid
          and o.status = 'novo'
          and o.created_at > now() - interval '24 hours'
      )
    end;
$$;

revoke all on function public.can_upload_order_image(text) from public;
grant execute on function public.can_upload_order_image(text)
  to anon, authenticated;

drop policy if exists "Public can upload order images" on storage.objects;
create policy "Public can upload order images"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'order-images'
  and public.can_upload_order_image(name)
);

drop policy if exists "Admins can read order images" on storage.objects;
create policy "Admins can read order images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'order-images'
  and public.is_admin()
);

drop policy if exists "Admins can delete order images" on storage.objects;
create policy "Admins can delete order images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'order-images'
  and public.is_admin()
);

-- ---------------------------------------------------------------------------
-- Configuração manual do administrador (NÃO executar com credenciais inventadas)
-- ---------------------------------------------------------------------------
-- 1. Em Authentication > Providers, desabilite novos cadastros públicos.
-- 2. Em Authentication > Users, crie o usuário do proprietário e confirme o e-mail.
-- 3. Copie o UUID do usuário e vincule-o à allowlist:
--
--    insert into public.admin_users (user_id)
--    values ('<UUID_DO_USUARIO_ADMIN>')
--    on conflict (user_id) do nothing;
--
-- Não há senha neste arquivo. O login será feito pelo Supabase Auth no painel.
