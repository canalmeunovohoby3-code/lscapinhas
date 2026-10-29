-- LS Case by LS Celulares
-- Fotos públicas dos modelos do catálogo, gerenciadas pelo painel.
-- Bucket separado das imagens privadas de pedidos (order-images).

create table if not exists public.catalog_model_images (
  id uuid primary key default gen_random_uuid(),
  brand_id text not null,
  model_id text not null,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint catalog_model_images_path_check
    check (storage_path ~ '^catalog/[a-z0-9-]+/[a-z0-9-]+/[a-z0-9][a-z0-9._-]*$')
);

create index if not exists catalog_model_images_model_idx
  on public.catalog_model_images (brand_id, model_id, sort_order);

alter table public.catalog_model_images enable row level security;

drop policy if exists "Catalog images are public" on public.catalog_model_images;
create policy "Catalog images are public"
  on public.catalog_model_images
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert catalog images" on public.catalog_model_images;
create policy "Admins can insert catalog images"
  on public.catalog_model_images
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update catalog images" on public.catalog_model_images;
create policy "Admins can update catalog images"
  on public.catalog_model_images
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete catalog images" on public.catalog_model_images;
create policy "Admins can delete catalog images"
  on public.catalog_model_images
  for delete
  to authenticated
  using (public.is_admin());

revoke all on table public.catalog_model_images from anon, authenticated;
grant select on table public.catalog_model_images to anon, authenticated;
grant insert, update, delete on table public.catalog_model_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images',
  'catalog-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read catalog images" on storage.objects;
create policy "Public can read catalog images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'catalog-images');

drop policy if exists "Admins can upload catalog images" on storage.objects;
create policy "Admins can upload catalog images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "Admins can update catalog images" on storage.objects;
create policy "Admins can update catalog images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'catalog-images' and public.is_admin())
  with check (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "Admins can delete catalog images" on storage.objects;
create policy "Admins can delete catalog images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'catalog-images' and public.is_admin());
