import type { Category, PhoneBrand, PhoneModel, Product, Style } from '../types/catalog';
import { catalog } from '../data/catalog';
import { normalizeText } from './format';

export type PriceBucketId = 'todos' | 'ate-40' | '40-50' | 'acima-50';
export type SortKey = 'relevancia' | 'menor-preco' | 'maior-preco' | 'nome';

export interface ProductFilters {
  query: string;
  category: string;
  style: string;
  modelId: string | null;
  price: PriceBucketId;
  sort: SortKey;
}

export const PRICE_BUCKETS: Array<{ id: PriceBucketId; label: string }> = [
  { id: 'todos', label: 'Todos os preços' },
  { id: 'ate-40', label: 'Até R$ 40' },
  { id: '40-50', label: 'R$ 40 a R$ 50' },
  { id: 'acima-50', label: 'Acima de R$ 50' },
];

export const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: 'relevancia', label: 'Relevância' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'nome', label: 'Nome A–Z' },
];

export const defaultFilters: ProductFilters = {
  query: '',
  category: 'todas',
  style: 'todos',
  modelId: null,
  price: 'todos',
  sort: 'relevancia',
};

interface FilterContext {
  products: Product[];
  models: PhoneModel[];
  brands: PhoneBrand[];
  categories: Category[];
  styles: Style[];
}

function isPriceMatch(price: number, bucket: PriceBucketId): boolean {
  if (bucket === 'ate-40') return price < 40;
  if (bucket === '40-50') return price >= 40 && price <= 50;
  if (bucket === 'acima-50') return price > 50;
  return true;
}

export function filterProducts(
  filters: Partial<ProductFilters> = {},
  context: FilterContext = catalog,
): Product[] {
  const state: ProductFilters = { ...defaultFilters, ...filters };
  const query = normalizeText(state.query);

  const categoryById = new Map(context.categories.map((item) => [item.id, item]));
  const styleById = new Map(context.styles.map((item) => [item.id, item]));
  const brandById = new Map(context.brands.map((item) => [item.id, item]));
  const modelById = new Map(context.models.map((item) => [item.id, item]));

  const matchingModelIds = new Set<string>();
  if (query) {
    for (const model of context.models) {
      const brand = brandById.get(model.brandId);
      const searchable = normalizeText(`${model.name} ${brand?.name ?? ''} ${brand?.shortName ?? ''}`);
      if (searchable.includes(query)) matchingModelIds.add(model.id);
    }
  }

  const result = context.products.filter((product) => {
    if (state.category !== 'todas' && product.category !== state.category) return false;
    if (state.style !== 'todos' && !product.styles.includes(state.style)) return false;
    if (state.modelId && !product.compatibleModels.includes(state.modelId)) return false;
    if (!isPriceMatch(product.price, state.price)) return false;

    if (query) {
      const category = categoryById.get(product.category);
      const modelNames = product.compatibleModels
        .map((id) => modelById.get(id))
        .filter((model): model is PhoneModel => Boolean(model))
        .map((model) => `${model.name} ${brandById.get(model.brandId)?.name ?? ''}`);
      const styleNames = product.styles.map((id) => styleById.get(id)?.name ?? id);
      const haystack = normalizeText(
        [product.name, product.description, category?.name ?? '', ...styleNames, ...modelNames].join(' '),
      );
      const matchesText = haystack.includes(query);
      const matchesModel = product.compatibleModels.some((id) => matchingModelIds.has(id));
      if (!matchesText && !matchesModel) return false;
    }

    return true;
  });

  if (state.sort === 'menor-preco') {
    return [...result].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'pt-BR'));
  }
  if (state.sort === 'maior-preco') {
    return [...result].sort((a, b) => b.price - a.price || a.name.localeCompare(b.name, 'pt-BR'));
  }
  if (state.sort === 'nome') {
    return [...result].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
  return result;
}

export function countActiveFilters(filters: ProductFilters): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.category !== 'todas') count += 1;
  if (filters.style !== 'todos') count += 1;
  if (filters.modelId) count += 1;
  if (filters.price !== 'todos') count += 1;
  return count;
}
