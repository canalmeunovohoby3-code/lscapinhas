import type { PhoneModel, Product } from '../types/catalog';
import { getModelById } from '../data/catalog';

export function stableModelIndex(key: string, length: number): number {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash % length;
}

export function getDefaultCompatibleModel(product: Product): PhoneModel | null {
  const models = product.compatibleModels
    .map((modelId) => getModelById(modelId))
    .filter((model): model is PhoneModel => Boolean(model));

  if (models.length === 0) return null;
  return models[stableModelIndex(product.id, models.length)];
}

export function resolveProductModel(
  product: Product,
  requestedModelId: string | null | undefined,
  options: { allowDefault?: boolean; fallbackModelId?: string | null } = {},
): PhoneModel | null {
  const requested = getModelById(requestedModelId ?? null);
  if (requested && product.compatibleModels.includes(requested.id)) {
    return requested;
  }

  const fallback = getModelById(options.fallbackModelId ?? null);
  if (fallback && product.compatibleModels.includes(fallback.id)) {
    return fallback;
  }

  if (options.allowDefault === false) {
    return null;
  }

  return getDefaultCompatibleModel(product);
}
