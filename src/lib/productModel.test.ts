import { describe, expect, it } from 'vitest';
import { catalog, getProductById } from '../data/catalog';
import { getDefaultCompatibleModel, resolveProductModel } from './productModel';

const floral = getProductById('ls-flor-de-cerejeira')!;

describe('product model resolution', () => {
  it('escolhe um modelo padrão realmente compatível e de forma estável', () => {
    const first = getDefaultCompatibleModel(floral);
    const second = getDefaultCompatibleModel(floral);
    expect(first).not.toBeNull();
    expect(floral.compatibleModels).toContain(first!.id);
    expect(second?.id).toBe(first?.id);
  });

  it('preserva o modelo solicitado quando ele é compatível', () => {
    const model = resolveProductModel(floral, 'iphone-15', { allowDefault: true });
    expect(model?.id).toBe('iphone-15');
  });

  it('não usa um modelo incompatível', () => {
    expect(resolveProductModel(floral, 'galaxy-a05s', { allowDefault: false })).toBeNull();
    const fallback = resolveProductModel(floral, 'galaxy-a05s', { allowDefault: true });
    expect(fallback).not.toBeNull();
    expect(floral.compatibleModels).toContain(fallback!.id);
  });

  it('usa o modelo selecionado como reserva quando o modelo solicitado não serve', () => {
    const model = resolveProductModel(floral, 'galaxy-a05s', {
      fallbackModelId: 'iphone-15',
      allowDefault: true,
    });
    expect(model?.id).toBe('iphone-15');
  });

  it('não inventa modelo quando o produto não tem compatibilidade', () => {
    const withoutCompatibility = { ...floral, compatibleModels: [] };
    expect(getDefaultCompatibleModel(withoutCompatibility)).toBeNull();
    expect(
      resolveProductModel(withoutCompatibility, null, { allowDefault: true }),
    ).toBeNull();
  });

  it('nunca escolhe um modelo fora da compatibilidade real do catálogo', () => {
    for (const product of catalog.products) {
      const model = getDefaultCompatibleModel(product);
      const again = getDefaultCompatibleModel(product);

      if (model) {
        expect(product.compatibleModels).toContain(model.id);
        expect(again?.id).toBe(model.id);
      } else {
        expect(product.compatibleModels).toHaveLength(0);
      }
    }
  });
});
