-- LS Case by LS Celulares
-- Idempotência de criação + token de upload por pedido.
-- Compatível com pedidos antigos: colunas novas são anuláveis.

alter table public.orders
  add column if not exists idempotency_key uuid,
  add column if not exists idempotency_hash text,
  add column if not exists upload_token_hash text,
  add column if not exists upload_token_expires_at timestamptz,
  add column if not exists upload_token_revoked_at timestamptz;

create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key);

alter table public.orders
  drop constraint if exists orders_idempotency_hash_check,
  drop constraint if exists orders_upload_token_hash_check,
  drop constraint if exists orders_idempotency_pair_check;

alter table public.orders
  add constraint orders_idempotency_hash_check
    check (idempotency_hash is null or idempotency_hash ~ '^[0-9a-f]{64}$'),
  add constraint orders_upload_token_hash_check
    check (upload_token_hash is null or upload_token_hash ~ '^[0-9a-f]{64}$'),
  add constraint orders_idempotency_pair_check
    check (idempotency_key is null or idempotency_hash is not null);

-- Caminhos novos incluem o token de upload. Caminhos antigos continuam válidos
-- para leitura e registros legados.
alter table public.order_images
  drop constraint if exists order_images_storage_path_check;

alter table public.order_images
  add constraint order_images_storage_path_check
    check (
      storage_path ~* '^orders/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/([0-9a-f]{64}/)?[a-z0-9][a-z0-9._-]*$'
    );

create or replace function public.create_public_order(
  p_customer_name text,
  p_customer_contact text,
  p_notes text,
  p_items jsonb,
  p_idempotency_key uuid
)
returns table (order_id uuid, upload_token text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_existing_id uuid;
  v_existing_hash text;
  v_existing_status public.order_status;
  v_existing_expires timestamptz;
  v_existing_revoked timestamptz;
  v_item jsonb;
  v_item_count integer;
  v_hash text;
  v_upload_token text;
  v_upload_token_hash text;
begin
  if p_idempotency_key is null then
    raise exception 'Chave de idempotência obrigatória.';
  end if;

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

  v_hash := encode(digest(
    jsonb_build_object(
      'customerName', coalesce(btrim(p_customer_name), ''),
      'customerContact', coalesce(btrim(p_customer_contact), ''),
      'notes', coalesce(btrim(p_notes), ''),
      'items', p_items
    )::text,
    'sha256'
  ), 'hex');

  v_upload_token := encode(gen_random_bytes(32), 'hex');
  v_upload_token_hash := encode(digest(v_upload_token, 'sha256'), 'hex');

  insert into public.orders (
    customer_name,
    customer_contact,
    notes,
    status,
    idempotency_key,
    idempotency_hash,
    upload_token_hash,
    upload_token_expires_at
  )
  values (
    nullif(btrim(coalesce(p_customer_name, '')), ''),
    nullif(btrim(coalesce(p_customer_contact, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    'novo',
    p_idempotency_key,
    v_hash,
    v_upload_token_hash,
    now() + interval '6 hours'
  )
  on conflict (idempotency_key) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    select
      o.id,
      o.idempotency_hash,
      o.status,
      o.upload_token_expires_at,
      o.upload_token_revoked_at
    into
      v_existing_id,
      v_existing_hash,
      v_existing_status,
      v_existing_expires,
      v_existing_revoked
    from public.orders o
    where o.idempotency_key = p_idempotency_key;

    if not found then
      raise exception 'Não foi possível resolver a idempotência do pedido.';
    end if;

    if v_existing_hash is distinct from v_hash then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;

    if v_existing_status <> 'novo'
      or v_existing_revoked is not null
      or v_existing_expires is null
      or v_existing_expires <= now()
    then
      return query select v_existing_id, null::text;
      return;
    end if;

    v_upload_token := encode(gen_random_bytes(32), 'hex');
    v_upload_token_hash := encode(digest(v_upload_token, 'sha256'), 'hex');

    update public.orders
    set
      upload_token_hash = v_upload_token_hash,
      upload_token_expires_at = now() + interval '6 hours',
      upload_token_revoked_at = null
    where id = v_existing_id;

    return query select v_existing_id, v_upload_token;
    return;
  end if;

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

  return query select v_order_id, v_upload_token;
end;
$$;

revoke all on function public.create_public_order(text, text, text, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.create_public_order(text, text, text, jsonb, uuid)
  to service_role;

create or replace function public.release_order_upload_token(
  p_order_id uuid,
  p_token text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_order_id is null or coalesce(btrim(p_token), '') = '' then
    return false;
  end if;

  update public.orders
  set upload_token_revoked_at = now()
  where id = p_order_id
    and upload_token_revoked_at is null
    and upload_token_hash = encode(digest(p_token, 'sha256'), 'hex');

  return found;
end;
$$;

revoke all on function public.release_order_upload_token(uuid, text) from public;
grant execute on function public.release_order_upload_token(uuid, text)
  to anon, authenticated;

create or replace function public.can_upload_order_image(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_token text;
begin
  if object_name !~* '^orders/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{64}/[a-z0-9][a-z0-9._-]*$' then
    return false;
  end if;

  v_order_id := split_part(object_name, '/', 2)::uuid;
  v_token := split_part(object_name, '/', 3);

  return exists (
    select 1
    from public.orders o
    where o.id = v_order_id
      and o.status = 'novo'
      and o.upload_token_revoked_at is null
      and o.upload_token_expires_at > now()
      and o.upload_token_hash = encode(digest(v_token, 'sha256'), 'hex')
  );
end;
$$;

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
  v_order_status public.order_status;
  v_order_created_at timestamptz;
  v_upload_token_hash text;
  v_upload_token_expires_at timestamptz;
  v_upload_token_revoked_at timestamptz;
  v_image jsonb;
  v_path text;
  v_item_id uuid;
  v_token text;
begin
  if p_order_id is null then
    raise exception 'Pedido não informado.';
  end if;

  select
    o.status,
    o.created_at,
    o.upload_token_hash,
    o.upload_token_expires_at,
    o.upload_token_revoked_at
  into
    v_order_status,
    v_order_created_at,
    v_upload_token_hash,
    v_upload_token_expires_at,
    v_upload_token_revoked_at
  from public.orders o
  where o.id = p_order_id;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_order_status <> 'novo' or v_order_created_at < now() - interval '24 hours' then
    raise exception 'Este pedido não aceita novas imagens.';
  end if;

  if v_upload_token_revoked_at is not null
    or v_upload_token_expires_at is null
    or v_upload_token_expires_at <= now()
  then
    raise exception 'A autorização de upload expirou.';
  end if;

  if p_images is null or jsonb_typeof(p_images) <> 'array' then
    raise exception 'Lista de imagens inválida.';
  end if;

  if jsonb_array_length(p_images) < 1 or jsonb_array_length(p_images) > 12 then
    raise exception 'Envie entre 1 e 12 imagens.';
  end if;

  for v_image in select value from jsonb_array_elements(p_images)
  loop
    v_path := v_image->>'path';

    if v_path !~* ('^orders/' || p_order_id::text || '/[0-9a-f]{64}/[a-z0-9][a-z0-9._-]*$') then
      raise exception 'Caminho de imagem inválido.';
    end if;

    v_token := split_part(v_path, '/', 3);

    if encode(digest(v_token, 'sha256'), 'hex') <> v_upload_token_hash then
      raise exception 'Token de upload inválido.';
    end if;

    v_item_id := nullif(v_image->>'itemId', '')::uuid;

    if v_item_id is not null and not exists (
      select 1
      from public.order_items oi
      where oi.id = v_item_id
        and oi.order_id = p_order_id
    ) then
      raise exception 'Item não pertence ao pedido.';
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
      nullif(btrim(v_image->>'fileName'), ''),
      nullif(btrim(v_image->>'contentType'), ''),
      nullif((v_image->>'sizeBytes')::bigint, 0)
    )
    on conflict (storage_path) do nothing;
  end loop;
end;
$$;

revoke all on function public.can_upload_order_image(text) from public;
grant execute on function public.can_upload_order_image(text)
  to anon, authenticated;

revoke all on function public.attach_order_images(uuid, jsonb) from public;
grant execute on function public.attach_order_images(uuid, jsonb)
  to anon, authenticated;
