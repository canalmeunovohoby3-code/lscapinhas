import { describe, expect, it } from 'vitest';
import {
  findCatalogSelection,
  groupCatalogImages,
  resolveInitialCatalogSelection,
  type CatalogImageSummary,
} from './catalogSelection';

const summaries: CatalogImageSummary[] = [
  {
    brandId: 'samsung',
    modelId: 'galaxy-s21-ultra',
    brandName: 'Samsung',
    modelName: 'Galaxy S21 Ultra',
    count: 1,
    previewPath: 'catalog/samsung/galaxy-s21-ultra/foto.png',
  },
];

describe('seleção de fotos do catálogo', () => {
  it('encontra marca/modelo válidos e usa o primeiro como fallback', () => {
    expect(findCatalogSelection('samsung', 'galaxy-s21-ultra')).toEqual({
      brandId: 'samsung',
      modelId: 'galaxy-s21-ultra',
    });
    expect(findCatalogSelection('inexistente', 'inexistente')).toEqual({
      brandId: 'apple',
      modelId: 'iphone-11',
    });
  });

  it('agrupa fotos por modelo sem duplicar o aparelho', () => {
    const grouped = groupCatalogImages([
      {
        brand_id: 'samsung',
        model_id: 'galaxy-s21-ultra',
        storage_path: 'catalog/samsung/galaxy-s21-ultra/a.png',
        sort_order: 0,
      },
      {
        brand_id: 'samsung',
        model_id: 'galaxy-s21-ultra',
        storage_path: 'catalog/samsung/galaxy-s21-ultra/b.png',
        sort_order: 1,
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(2);
    expect(grouped[0].previewPath).toContain('/a.png');
  });

  it('prefere a seleção pedida, depois o primeiro modelo com foto', () => {
    expect(resolveInitialCatalogSelection('motorola', 'moto-g84', summaries)).toEqual({
      brandId: 'motorola',
      modelId: 'moto-g84',
    });
    expect(resolveInitialCatalogSelection(null, null, summaries)).toEqual({
      brandId: 'samsung',
      modelId: 'galaxy-s21-ultra',
    });
    expect(resolveInitialCatalogSelection(null, null, [])).toEqual({
      brandId: 'apple',
      modelId: 'iphone-11',
    });
  });
});
