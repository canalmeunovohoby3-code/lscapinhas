import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';

describe('catálogo demonstrativo', () => {
  it('mantém identificadores únicos para produtos e slugs', () => {
    const ids = catalog.products.map((product) => product.id);
    const slugs = catalog.products.map((product) => product.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('usa somente marcas e modelos existentes na compatibilidade', () => {
    const modelIds = new Set(catalog.models.map((model) => model.id));
    for (const product of catalog.products) {
      expect(product.compatibleModels.length).toBeGreaterThan(0);
      for (const modelId of product.compatibleModels) {
        expect(modelIds.has(modelId), `${product.slug} → ${modelId}`).toBe(true);
      }
    }
  });

  it('usa categorias, estilos e imagens válidos', () => {
    const categoryIds = new Set(catalog.categories.map((category) => category.id));
    const styleIds = new Set(catalog.styles.map((style) => style.id));
    for (const product of catalog.products) {
      expect(categoryIds.has(product.category), product.slug).toBe(true);
      expect(product.styles.length).toBeGreaterThan(0);
      for (const style of product.styles) {
        expect(styleIds.has(style), `${product.slug} → ${style}`).toBe(true);
      }
      expect(product.images.length).toBeGreaterThan(0);
      expect(product.images.every((image) => image.startsWith('/cases/'))).toBe(true);
    }
  });

  it('mantém preços, variações e identificação demonstrativa consistentes', () => {
    for (const product of catalog.products) {
      expect(product.price).toBeGreaterThan(0);
      expect(product.demo).toBe(true);
      expect(product.name.trim().length).toBeGreaterThan(0);
      expect(product.description.trim().length).toBeGreaterThan(0);
      const variantIds = product.variants.map((variant) => variant.id);
      expect(new Set(variantIds).size).toBe(variantIds.length);
      if (product.originalPrice) {
        expect(product.originalPrice).toBeGreaterThan(product.price);
      }
    }
  });

  it('não duplica modelos entre marcas', () => {
    const ids = catalog.models.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const brand of catalog.brands) {
      expect(brand.models.length).toBeGreaterThan(0);
      expect(brand.models.every((model) => model.brandId === brand.id)).toBe(true);
    }
  });
});
