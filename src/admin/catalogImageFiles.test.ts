import { describe, expect, it } from 'vitest';
import {
  MAX_CATALOG_IMAGES,
  createCatalogImagePath,
  validateCatalogImageFiles,
} from './catalogImageFiles';

const FILE_ID = '33333333-3333-4333-8333-333333333333';

const jpeg = {
  name: 'capinha.jpg',
  size: 1_000_000,
  type: 'image/jpeg',
};

describe('fotos do catálogo', () => {
  it('gera caminho separado por marca e modelo', () => {
    expect(createCatalogImagePath('apple', 'iphone-16', jpeg, FILE_ID))
      .toBe(`catalog/apple/iphone-16/${FILE_ID}.jpg`);
    expect(createCatalogImagePath('motorola', 'moto-g84', jpeg, FILE_ID))
      .toBe(`catalog/motorola/moto-g84/${FILE_ID}.jpg`);
  });

  it('rejeita marca, modelo, formato ou identificador inválidos', () => {
    expect(() => createCatalogImagePath('Apple Inc', 'iphone-16', jpeg, FILE_ID)).toThrow();
    expect(() => createCatalogImagePath('apple', 'iPhone 16', jpeg, FILE_ID)).toThrow();
    expect(() => createCatalogImagePath('apple', 'iphone-16', { type: 'image/gif' }, FILE_ID))
      .toThrow();
    expect(() => createCatalogImagePath('apple', 'iphone-16', jpeg, 'invalido')).toThrow();
  });

  it('valida tipo, tamanho e total de fotos por modelo', () => {
    expect(validateCatalogImageFiles([jpeg], 0)).toBeNull();
    expect(validateCatalogImageFiles([{ ...jpeg, type: 'image/gif' }], 0))
      .toContain('JPEG');
    expect(validateCatalogImageFiles([{ ...jpeg, size: 10 * 1024 * 1024 + 1 }], 0))
      .toContain('10 MB');
    expect(validateCatalogImageFiles([jpeg], MAX_CATALOG_IMAGES))
      .toBe(`Cada modelo pode ter no máximo ${MAX_CATALOG_IMAGES} fotos.`);
  });
});
