-- LS Case by LS Celulares
-- pgcrypto é instalado no schema "extensions" no Supabase. As funções
-- SECURITY DEFINER que usam digest() precisam enxergar esse schema mesmo
-- quando a configuração do projeto o remove do search_path padrão.

alter function public.create_public_order(text, text, text, jsonb, uuid)
  set search_path = public, extensions, pg_temp;

alter function public.attach_order_images(uuid, jsonb)
  set search_path = public, extensions, pg_temp;

alter function public.can_upload_order_image(text)
  set search_path = public, extensions, pg_temp;

alter function public.release_order_upload_token(uuid, text)
  set search_path = public, extensions, pg_temp;
