import { catalog, getBrandById, getModelById } from '../data/catalog';
import { getMockupEntry } from '../customizer/registry';
import type { PhoneBrand, PhoneModel } from '../types/catalog';
import { normalizeText } from './format';

export function resolveJourneyBrand(
  brandId: string | null | undefined,
  modelId: string | null | undefined,
): PhoneBrand | null {
  const explicitBrand = getBrandById(brandId);
  if (explicitBrand) return explicitBrand;

  const model = getModelById(modelId);
  return model ? getBrandById(model.brandId) ?? null : null;
}

export function getJourneyModels(
  brandId: string | null | undefined,
  query = '',
): PhoneModel[] {
  const brand = getBrandById(brandId);
  if (!brand) return [];

  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return brand.models;

  return brand.models.filter((model) => normalizeText(model.name).includes(normalizedQuery));
}

export function isPersonalizationAvailable(modelId: string | null | undefined): boolean {
  return Boolean(getMockupEntry(modelId));
}

export function getJourneyModel(
  brandId: string | null | undefined,
  modelId: string | null | undefined,
): PhoneModel | null {
  const model = getModelById(modelId);

  if (!model) return null;

  const brand = getBrandById(brandId);
  if (brand && model.brandId !== brand.id) return null;

  return model;
}

export function getJourneyBrands(): PhoneBrand[] {
  return catalog.brands;
}
