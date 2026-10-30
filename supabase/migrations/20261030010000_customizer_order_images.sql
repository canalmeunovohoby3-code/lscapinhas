-- LS Case by LS Celulares
-- Metadados da personalização e vínculo das imagens ao item do pedido.
--
-- Justificativa: o fluxo atual já possui order_item_id, mas não distinguia
-- fotografia original, composição final e imagens de referência, nem guardava
-- mockup/versão/enquadramento. A alteração é aditiva e preserva pedidos antigos.

alter table public.order_images
  add column if not exists kind text not null default 'reference',
  add column if not exists metadata jsonb;

alter table public.order_images
  drop constraint if exists order_images_kind_check;

alter table public.order_images
  add constraint order_images_kind_check
    check (kind in ('reference', 'original', 'composition'));

create index if not exists order_images_kind_idx on public.order_images (kind);

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
  v_model_id text;
  v_kind text;
  v_metadata jsonb;
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
    raise exception 'Envie entre 1 e 12 imagens por pedido.';
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

    v_kind := coalesce(nullif(btrim(coalesce(v_image->>'kind', '')), ''), 'reference');
    if v_kind not in ('reference', 'original', 'composition') then
      raise exception 'Tipo de imagem inválido.';
    end if;

    v_metadata := case
      when jsonb_typeof(v_image->'metadata') = 'object' then v_image->'metadata'
      else null
    end;

    v_item_id := nullif(v_image->>'itemId', '')::uuid;
    v_model_id := nullif(btrim(coalesce(v_image->>'modelId', '')), '');

    if v_item_id is null and v_model_id is not null then
      select oi.id
      into v_item_id
      from public.order_items oi
      where oi.order_id = p_order_id
        and oi.model_id = v_model_id
      limit 1;

      if v_item_id is null then
        raise exception 'Item não encontrado para a imagem.';
      end if;
    end if;

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
      size_bytes,
      kind,
      metadata
    )
    values (
      p_order_id,
      v_item_id,
      v_path,
      nullif(btrim(coalesce(v_image->>'fileName', '')), ''),
      nullif(btrim(coalesce(v_image->>'contentType', '')), ''),
      nullif((v_image->>'sizeBytes')::bigint, 0),
      v_kind,
      v_metadata
    )
    on conflict (storage_path) do nothing;
  end loop;
end;
$$;

revoke all on function public.attach_order_images(uuid, jsonb) from public;
grant execute on function public.attach_order_images(uuid, jsonb)
  to anon, authenticated;
