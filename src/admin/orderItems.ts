import { getBrandById, getModelById } from '../data/catalog';
import type { AdminOrderItem } from './types';

export interface ResolvedOrderItem {
  brandName: string;
  modelName: string;
}

export function resolveOrderItem(
  item: Pick<AdminOrderItem, 'brand_name' | 'model_id' | 'model_name'>,
): ResolvedOrderItem {
  const catalogModel = getModelById(item.model_id);
  const catalogBrand = catalogModel ? getBrandById(catalogModel.brandId) : undefined;

  return {
    brandName: catalogBrand?.shortName || item.brand_name?.trim() || 'Marca não informada',
    modelName: item.model_name?.trim() || catalogModel?.name || 'Modelo não informado',
  };
}

export function formatOrderItemLabel(
  item: Pick<AdminOrderItem, 'brand_name' | 'model_id' | 'model_name'>,
): string {
  const { brandName, modelName } = resolveOrderItem(item);
  return `${brandName} — ${modelName}`;
}
