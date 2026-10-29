import { catalog } from '../data/catalog';
import type { CatalogModelImage } from '../lib/catalogImages';

export interface CatalogSelection {
  brandId: string;
  modelId: string;
}

export interface CatalogImageSummary extends CatalogSelection {
  brandName: string;
  modelName: string;
  count: number;
  previewPath: string;
}

export function findCatalogSelection(
  brandId?: string | null,
  modelId?: string | null,
): CatalogSelection {
  const brand = catalog.brands.find((entry) => entry.id === brandId)
    ?? catalog.brands[0];
  const model = brand?.models.find((entry) => entry.id === modelId)
    ?? brand?.models[0];

  return {
    brandId: brand?.id ?? '',
    modelId: model?.id ?? '',
  };
}

export function groupCatalogImages(
  rows: readonly Pick<
    CatalogModelImage,
    'brand_id' | 'model_id' | 'storage_path' | 'sort_order'
  >[],
): CatalogImageSummary[] {
  const grouped = new Map<string, CatalogImageSummary>();

  for (const row of rows) {
    const brand = catalog.brands.find((entry) => entry.id === row.brand_id);
    const model = brand?.models.find((entry) => entry.id === row.model_id);
    if (!brand || !model) continue;

    const key = `${row.brand_id}/${row.model_id}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, {
        brandId: row.brand_id,
        modelId: row.model_id,
        brandName: brand.shortName,
        modelName: model.name,
        count: 1,
        previewPath: row.storage_path,
      });
    }
  }

  return [...grouped.values()].sort((a, b) => (
    a.brandName.localeCompare(b.brandName) || a.modelName.localeCompare(b.modelName)
  ));
}

export function resolveInitialCatalogSelection(
  brandId: string | null | undefined,
  modelId: string | null | undefined,
  summaries: readonly CatalogImageSummary[],
): CatalogSelection {
  const requested = findCatalogSelection(brandId, modelId);
  const hasRequestedBrand = catalog.brands.some((entry) => entry.id === brandId);

  if (hasRequestedBrand) return requested;

  if (summaries.length > 0) {
    return { brandId: summaries[0].brandId, modelId: summaries[0].modelId };
  }

  return requested;
}
