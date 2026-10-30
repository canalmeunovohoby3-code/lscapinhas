import { supabase } from './supabase';

export const CHARGER_IMAGE_BUCKET = 'charger-images';

export function getChargerImageUrl(storagePath: string): string | null {
  if (!supabase) return null;

  return supabase.storage
    .from(CHARGER_IMAGE_BUCKET)
    .getPublicUrl(storagePath).data.publicUrl;
}

export function formatChargerPrice(priceCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100);
}
