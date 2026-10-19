import type { Category, PhoneBrand, PhoneModel, Product } from '../types/catalog';
import { phoneBrands, phoneModels } from './phones';
import { products } from './products';
import { categories, styles } from './taxonomy';

export const catalog = {
  products,
  brands: phoneBrands,
  models: phoneModels,
  categories,
  styles,
};

export function getProductBySlug(slug: string): Product | undefined {
  return catalog.products.find((product) => product.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return catalog.products.find((product) => product.id === id);
}

export function getModelById(id: string | null | undefined): PhoneModel | undefined {
  if (!id) return undefined;
  return catalog.models.find((model) => model.id === id);
}

export function getBrandById(id: string | null | undefined): PhoneBrand | undefined {
  if (!id) return undefined;
  return catalog.brands.find((brand) => brand.id === id);
}

export function getBrandForModel(modelId: string): PhoneBrand | undefined {
  const model = getModelById(modelId);
  return model ? getBrandById(model.brandId) : undefined;
}

export function getCategoryById(id: string | null | undefined): Category | undefined {
  if (!id) return undefined;
  return catalog.categories.find((category) => category.id === id);
}

export function getStyleName(id: string): string {
  return catalog.styles.find((style) => style.id === id)?.name ?? id;
}

export function getModelsByIds(ids: string[]): PhoneModel[] {
  return ids
    .map((id) => getModelById(id))
    .filter((model): model is PhoneModel => Boolean(model));
}

export function getProductsForModel(modelId: string): Product[] {
  return catalog.products.filter((product) => product.compatibleModels.includes(modelId));
}
