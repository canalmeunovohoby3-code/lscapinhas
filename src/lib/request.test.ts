import { describe, expect, it } from 'vitest';
import {
  LEGACY_CART_STORAGE_KEY,
  REQUEST_NOTES_STORAGE_KEY,
  REQUEST_STORAGE_KEY,
  addRequestItem,
  hydrateRequest,
  loadRequest,
  loadRequestNotes,
  removeRequestItem,
  requestTotals,
  saveRequest,
  saveRequestNotes,
  updateRequestQuantity,
} from './request';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe('custom request items', () => {
  it('adiciona modelo e mescla a quantidade do mesmo aparelho', () => {
    let items = addRequestItem([], 'iphone-15', 2);
    items = addRequestItem(items, 'iphone-15', 1);
    expect(items).toEqual([{ modelId: 'iphone-15', quantity: 3 }]);
  });

  it('mantém modelos diferentes em itens separados', () => {
    let items = addRequestItem([], 'iphone-15', 1);
    items = addRequestItem(items, 'moto-g84', 2);
    expect(items).toEqual([
      { modelId: 'iphone-15', quantity: 1 },
      { modelId: 'moto-g84', quantity: 2 },
    ]);
    expect(requestTotals(items)).toEqual({ modelCount: 2, unitCount: 3 });
  });

  it('atualiza e remove quantidades por modelo', () => {
    let items = addRequestItem([], 'iphone-15', 1);
    items = addRequestItem(items, 'moto-g84', 1);
    items = updateRequestQuantity(items, 'iphone-15', 4);
    expect(items.find((item) => item.modelId === 'iphone-15')?.quantity).toBe(4);
    items = updateRequestQuantity(items, 'moto-g84', 0);
    expect(items).toEqual([{ modelId: 'iphone-15', quantity: 4 }]);
    expect(removeRequestItem(items, 'iphone-15')).toEqual([]);
  });

  it('ignora modelo inexistente e quantidade inválida', () => {
    expect(addRequestItem([], 'modelo-inexistente', 1)).toEqual([]);
    expect(addRequestItem([], 'iphone-15', 0)).toEqual([]);
    expect(addRequestItem([], 'iphone-15', Number.NaN)).toEqual([]);
  });

  it('hidrata somente itens válidos, mesclando duplicados', () => {
    const raw = JSON.stringify([
      { modelId: 'iphone-15', quantity: 2 },
      { modelId: 'iphone-15', quantity: 1 },
      { modelId: 'modelo-inexistente', quantity: 5 },
      { modelId: 'moto-g84', quantity: 0 },
      { modelId: 'galaxy-s24', quantity: 1 },
    ]);
    expect(hydrateRequest(raw)).toEqual([
      { modelId: 'iphone-15', quantity: 3 },
      { modelId: 'galaxy-s24', quantity: 1 },
    ]);
  });

  it('migra itens válidos do carrinho antigo uma única vez', () => {
    const legacy = JSON.stringify([
      { productId: 'ls-flor-de-cerejeira', modelId: 'iphone-15', quantity: 2 },
      { productId: 'ls-minimal-off-white', modelId: null, quantity: 1 },
      { productId: 'ls-estrelas-doce', modelId: 'moto-g84', quantity: 1 },
    ]);
    const storage = memoryStorage({ [LEGACY_CART_STORAGE_KEY]: legacy });
    expect(loadRequest(storage)).toEqual([
      { modelId: 'iphone-15', quantity: 2 },
      { modelId: 'moto-g84', quantity: 1 },
    ]);

    const alreadyMigrated = memoryStorage({
      [LEGACY_CART_STORAGE_KEY]: legacy,
      [REQUEST_STORAGE_KEY]: '[]',
    });
    expect(loadRequest(alreadyMigrated)).toEqual([]);
  });

  it('persiste e restaura a solicitação e as observações', () => {
    const storage = memoryStorage();
    const items = addRequestItem([], 'galaxy-s24', 3);
    saveRequest(items, storage);
    saveRequestNotes('Quero a foto inteira.', storage);

    expect(loadRequest(storage)).toEqual(items);
    expect(loadRequestNotes(storage)).toBe('Quero a foto inteira.');
    expect(storage.getItem(REQUEST_NOTES_STORAGE_KEY)).toBe('Quero a foto inteira.');

    saveRequestNotes('', storage);
    expect(loadRequestNotes(storage)).toBe('');
  });
});
