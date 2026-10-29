import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

export const CATALOG_IMAGE_BUCKET = 'catalog-images';

export interface CatalogModelImage {
  id: string;
  brand_id: string;
  model_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
}

export function getCatalogImageUrl(storagePath: string): string | null {
  if (!supabase) return null;
  return supabase.storage.from(CATALOG_IMAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export function useCatalogModelImages(): Map<string, string[]> {
  const [grouped, setGrouped] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    supabase
      .from('catalog_model_images')
      .select('model_id, storage_path, sort_order')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active || error) return;

        const next: Record<string, string[]> = {};

        for (const image of (data ?? []) as Array<{
          model_id: string;
          storage_path: string;
          sort_order: number;
        }>) {
          const url = getCatalogImageUrl(image.storage_path);
          if (!url) continue;
          if (!next[image.model_id]) next[image.model_id] = [];
          next[image.model_id].push(url);
        }

        setGrouped(next);
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => new Map(Object.entries(grouped)), [grouped]);
}
