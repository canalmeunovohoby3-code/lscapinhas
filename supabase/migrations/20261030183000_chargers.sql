-- LS Case by LS Celulares
-- Carregadores gerenciados pelo painel administrativo.
-- Bucket separado das imagens de pedidos e das fotos do catálogo.

create table if not exists public.chargers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_cents integer not null default 0,
  image_path text not null unique,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chargers_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint chargers_description_check
    check (char_length(description) <= 2000),
  constraint chargers_price_check
    check (price_cents >= 0),
  constraint chargers_image_path_check
    check (image_path ~ '^chargers/[a-z0-9-]+\.(jpg|jpeg|png|webp)$')
);

create index if not exists chargers_created_at_idx
  on public.chargers (created_at desc);

create or replace function public.set_chargers_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chargers_updated_at on public.chargers;
create trigger chargers_updated_at
before update on public.chargers
for each row execute function public.set_chargers_updated_at();

alter table public.chargers enable row level security;

drop policy if exists "Chargers are public" on public.chargers;
create policy "Chargers are public"
  on public.chargers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert chargers" on public.chargers;
create policy "Admins can insert chargers"
  on public.chargers
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update chargers" on public.chargers;
create policy "Admins can update chargers"
  on public.chargers
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete chargers" on public.chargers;
create policy "Admins can delete chargers"
  on public.chargers
  for delete
  to authenticated
  using (public.is_admin());

revoke all on table public.chargers from anon, authenticated;
grant select on table public.chargers to anon, authenticated;
grant insert, update, delete on table public.chargers to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'charger-images',
  'charger-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read charger images" on storage.objects;
create policy "Public can read charger images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'charger-images');

drop policy if exists "Admins can upload charger images" on storage.objects;
create policy "Admins can upload charger images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'charger-images' and public.is_admin());

drop policy if exists "Admins can update charger images" on storage.objects;
create policy "Admins can update charger images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'charger-images' and public.is_admin())
  with check (bucket_id = 'charger-images' and public.is_admin());

drop policy if exists "Admins can delete charger images" on storage.objects;
create policy "Admins can delete charger images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'charger-images' and public.is_admin());
