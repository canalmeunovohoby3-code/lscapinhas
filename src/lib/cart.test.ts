import { describe, expect, it } from 'vitest';
import type { CartItem, Product } from '../types/catalog';
import { catalog, getProductById } from '../data/catalog';
import {
  addItem,
  cartItemKey,
  cartTotals,
  checkoutIssues,
  createOrderId,
  hydrateCart,
  loadBuyerName,
  loadCartFromStorage,
  removeItem,
  resolveCart,
  saveBuyerName,
  saveCartToStorage,
  setItemQuantity,
} from './cart';

const floral = getProductById('ls-flor-de-cerejeira')!;
const crystal = getProductById('ls-cristal-transparente')!;

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: floral.id,
    modelId: 'iphone-15',
    variantId: 'rose',
    quantity: 1,
    ...overrides,
  };
}

describe('cart operations', () => {
  it('adiciona um item e mescla itens idênticos', () => {
    const once = addItem([], item({ quantity: 2 }));
    expect(once).toHaveLength(1);
    expect(once[0].quantity).toBe(2);

    const twice = addItem(once, item({ quantity: 2 }));
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(4);
  });

  it('separa o mesmo produto em modelos diferentes', () => {
    const cart = addItem([], item());
    const otherModel = addItem(cart, item({ modelId: 'galaxy-a55' }));
    expect(otherModel).toHaveLength(2);
    expect(new Set(otherModel.map((entry) => entry.modelId)).size).toBe(2);
  });

  it('permite o mesmo produto sem modelo e para modelos diferentes', () => {
    const withoutModel = addItem([], item({ modelId: null }));
    const forIphone = addItem(withoutModel, item({ modelId: 'iphone-15' }));
    const forSamsung = addItem(forIphone, item({ modelId: 'galaxy-a55' }));
    expect(forSamsung).toHaveLength(3);
    expect(forSamsung.map((entry) => entry.modelId)).toEqual([
      null,
      'iphone-15',
      'galaxy-a55',
    ]);
  });

  it('diferencia o item sem modelo do item com modelo', () => {
    expect(cartItemKey(floral.id, null, 'rose')).not.toBe(
      cartItemKey(floral.id, 'iphone-15', 'rose'),
    );
  });

  it('não bloqueia a compra quando o modelo não foi informado', () => {
    const resolved = resolveCart([
      item({ modelId: null, quantity: 2 }),
      item({
        productId: crystal.id,
        modelId: null,
        variantId: null,
        quantity: 1,
      }),
    ]);
    const totals = cartTotals(resolved);
    expect(resolved.flatMap((entry) => entry.issues)).toHaveLength(0);
    expect(totals.itemCount).toBe(2);
    expect(totals.unitCount).toBe(3);
    expect(totals.total).toBeCloseTo(floral.price * 2 + crystal.price, 2);
    expect(checkoutIssues(resolved, 'Ana')).toHaveLength(0);
  });

  it('atualiza quantidades, remove itens e respeita o limite', () => {
    const key = cartItemKey(floral.id, 'iphone-15', 'rose');
    const cart = addItem([], item({ quantity: 1 }));
    expect(setItemQuantity(cart, key, 5)[0].quantity).toBe(5);
    expect(setItemQuantity(cart, key, 500)[0].quantity).toBe(99);
    expect(setItemQuantity(cart, key, 0)).toHaveLength(0);
    expect(removeItem(cart, key)).toHaveLength(0);
  });

  it('calcula subtotais e total a partir dos preços atuais do catálogo', () => {
    const cart = [
      item({ quantity: 2 }),
      item({
        productId: crystal.id,
        modelId: 'iphone-15',
        variantId: null,
        quantity: 1,
      }),
    ];
    const resolved = resolveCart(cart);
    const totals = cartTotals(resolved);
    expect(totals.itemCount).toBe(2);
    expect(totals.unitCount).toBe(3);
    expect(totals.total).toBeCloseTo(floral.price * 2 + crystal.price, 2);
    expect(resolved[0].subtotal).toBeCloseTo(floral.price * 2, 2);
  });

  it('acusa modelo incompatível, variação ausente e produto indisponível', () => {
    const incompatible = resolveCart([
      item({ modelId: 'galaxy-a05s' }),
    ]);
    expect(incompatible[0].issues.join(' ')).toMatch(/não é compatível/i);

    const missingVariant = resolveCart([item({ variantId: null })]);
    expect(missingVariant[0].issues.join(' ')).toMatch(/variação/i);

    const unavailableProduct: Product = { ...floral, available: false };
    const unavailable = resolveCart([item()], {
      products: [unavailableProduct],
      models: catalog.models,
    });
    expect(unavailable[0].issues.join(' ')).toMatch(/indisponível/i);
  });

  it('bloqueia finalização sem nome ou com itens inválidos', () => {
    const resolved = resolveCart([item({ modelId: 'galaxy-a05s' })]);
    const issues = checkoutIssues(resolved, '');
    expect(issues.some((issue) => /nome/i.test(issue))).toBe(true);
    expect(issues.some((issue) => /compatível/i.test(issue))).toBe(true);
    expect(checkoutIssues([], 'Ana')).toContain('Seu carrinho está vazio.');
    expect(checkoutIssues(resolveCart([item()]), 'Ana')).toHaveLength(0);
  });

  it('gera um identificador local de pedido previsível', () => {
    const id = createOrderId(new Date(2026, 9, 19));
    expect(id).toMatch(/^LS-261019-[A-Z0-9]{4}$/);
  });
});

describe('cart hydration and persistence', () => {
  it('restaura somente itens válidos e mescla duplicados', () => {
    const raw = JSON.stringify([
      item({ quantity: 2 }),
      item({ quantity: 3 }),
      item({ productId: 'produto-inexistente' }),
      item({ modelId: 'modelo-inexistente' }),
      item({ modelId: 'galaxy-a05s' }),
      item({ variantId: 'variacao-inexistente' }),
      item({ quantity: 0 }),
      { productId: floral.id, modelId: 'iphone-15', variantId: 'rose', quantity: 1.5 },
      'texto solto',
    ]);
    const cart = hydrateCart(raw);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(5);
  });

  it('mantém o produto sem variação com variantId nulo', () => {
    const raw = JSON.stringify([
      { productId: crystal.id, modelId: 'iphone-15', variantId: 'invalida', quantity: 1 },
    ]);
    const cart = hydrateCart(raw);
    expect(cart).toHaveLength(1);
    expect(cart[0].variantId).toBeNull();
  });

  it('restaura item sem modelo selecionado', () => {
    const raw = JSON.stringify([
      { productId: floral.id, modelId: null, variantId: 'rose', quantity: 1 },
    ]);
    expect(hydrateCart(raw)).toEqual([
      { productId: floral.id, modelId: null, variantId: 'rose', quantity: 1 },
    ]);
  });

  it('ignora JSON inválido', () => {
    expect(hydrateCart('{quebrado')).toEqual([]);
    expect(hydrateCart(null)).toEqual([]);
    expect(hydrateCart('{}')).toEqual([]);
  });

  it('salva e recarrega o carrinho do storage', () => {
    const storage = memoryStorage();
    const cart = addItem([], item({ quantity: 2 }));
    saveCartToStorage(cart, storage);
    expect(loadCartFromStorage(storage)).toEqual(cart);
  });

  it('salva e recarrega o nome do comprador', () => {
    const storage = memoryStorage();
    saveBuyerName('Ana Souza', storage);
    expect(loadBuyerName(storage)).toBe('Ana Souza');
  });
});
