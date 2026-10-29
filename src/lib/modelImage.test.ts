import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { getModelIllustration } from './modelImage';

describe('model illustration', () => {
  it('reutiliza somente imagens existentes do catálogo', () => {
    const availableImages = new Set(
      catalog.products.flatMap((product) => product.images),
    );

    for (const model of catalog.models) {
      const illustration = getModelIllustration(model);
      expect(availableImages.has(illustration.image)).toBe(true);
      expect(availableImages.has(illustration.hoverImage)).toBe(true);
    }
  });

  it('mantém a mesma imagem para o mesmo modelo em qualquer filtro', () => {
    for (const model of catalog.models) {
      const index = catalog.models.findIndex((entry) => entry.id === model.id);
      const expected = catalog.products[index % catalog.products.length];
      expect(getModelIllustration(model).image).toBe(expected.images[0]);
    }
  });

  it('cobre todos os modelos reais sem criar imagens novas', () => {
    expect(catalog.models.length).toBeGreaterThan(0);
    expect(catalog.products.length).toBeGreaterThan(0);
    expect(getModelIllustration(catalog.models[0]).image).toMatch(/^\/cases\//);
  });
});
