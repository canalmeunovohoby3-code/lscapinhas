import type {
  CartItem,
  PhoneModel,
  Product,
  ResolvedCartItem,
} from '../types/catalog';
import { catalog } from '../data/catalog';

export const CART_STORAGE_KEY = 'lscase:cart:v1';
export const MODEL_STORAGE_KEY = 'lscase:model:v1';
export const BUYER_STORAGE_KEY = 'lscase:buyer:v1';
export const MAX_QUANTITY = 99;

interface CartContext {
  products: Product[];
  models: PhoneModel[];
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function cartItemKey(
  productId: string,
  modelId: string | null,
  variantId: string | null,
): string {
  return `${productId}::${modelId ?? 'sem-modelo'}::${variantId ?? 'unico'}`;
}

export function addItem(
  cart: CartItem[],
  input: Omit<CartItem, 'quantity'> & { quantity: number },
): CartItem[] {
  const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(input.quantity)));
  const key = cartItemKey(input.productId, input.modelId, input.variantId);
  const existing = cart.find(
    (item) => cartItemKey(item.productId, item.modelId, item.variantId) === key,
  );

  if (existing) {
    return cart.map((item) =>
      cartItemKey(item.productId, item.modelId, item.variantId) === key
        ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + quantity) }
        : item,
    );
  }

  return [
    ...cart,
    {
      productId: input.productId,
      modelId: input.modelId,
      variantId: input.variantId,
      quantity,
    },
  ];
}

export function removeItem(cart: CartItem[], key: string): CartItem[] {
  return cart.filter(
    (item) => cartItemKey(item.productId, item.modelId, item.variantId) !== key,
  );
}

export function setItemQuantity(cart: CartItem[], key: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeItem(cart, key);
  const nextQuantity = Math.min(MAX_QUANTITY, Math.trunc(quantity));
  return cart.map((item) =>
    cartItemKey(item.productId, item.modelId, item.variantId) === key
      ? { ...item, quantity: nextQuantity }
      : item,
  );
}

export function resolveCart(
  cart: CartItem[],
  context: CartContext = catalog,
): ResolvedCartItem[] {
  return cart.map((item) => {
    const product = context.products.find((entry) => entry.id === item.productId);
    const model = item.modelId
      ? context.models.find((entry) => entry.id === item.modelId)
      : undefined;
    const variant = product?.variants.find((entry) => entry.id === item.variantId) ?? null;
    const issues: string[] = [];

    if (!product) {
      issues.push('Produto não encontrado no catálogo atual.');
    } else {
      if (!product.available) issues.push('Produto indisponível no momento.');
      if (item.modelId && !model) {
        issues.push('Selecione novamente o modelo do celular.');
      } else if (model && !product.compatibleModels.includes(model.id)) {
        issues.push('O modelo selecionado não é compatível com esta capinha.');
      }
      if (product.variants.length > 0) {
        if (!item.variantId) {
          issues.push('Selecione uma variação.');
        } else if (!variant) {
          issues.push('A variação selecionada não está disponível.');
        }
      } else if (item.variantId) {
        issues.push('Esta capinha não possui variações.');
      }
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      issues.push('Quantidade inválida.');
    }

    const unitPrice = product?.price ?? 0;
    const subtotal = unitPrice * item.quantity;

    return {
      key: cartItemKey(item.productId, item.modelId, item.variantId),
      item,
      product,
      model,
      variant,
      unitPrice,
      subtotal,
      issues,
    };
  });
}

export function cartTotals(items: ResolvedCartItem[]): {
  itemCount: number;
  unitCount: number;
  total: number;
} {
  return items.reduce(
    (acc, entry) => {
      if (!entry.product) return acc;
      acc.itemCount += 1;
      acc.unitCount += entry.item.quantity;
      acc.total += entry.unitPrice * entry.item.quantity;
      return acc;
    },
    { itemCount: 0, unitCount: 0, total: 0 },
  );
}

export function checkoutIssues(
  items: ResolvedCartItem[],
  customerName: string,
): string[] {
  const issues = items.flatMap((entry) => entry.issues);
  if (items.length === 0) issues.push('Seu carrinho está vazio.');
  if (customerName.trim().length < 2) {
    issues.push('Informe seu nome para o atendimento.');
  }
  return issues;
}

export function hydrateCart(
  raw: string | null,
  context: CartContext = catalog,
): CartItem[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  let cart: CartItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.productId !== 'string') {
      continue;
    }
    if (
      candidate.modelId !== null &&
      candidate.modelId !== undefined &&
      typeof candidate.modelId !== 'string'
    ) {
      continue;
    }
    const modelId =
      typeof candidate.modelId === 'string' && candidate.modelId
        ? candidate.modelId
        : null;
    if (
      candidate.variantId !== null &&
      candidate.variantId !== undefined &&
      typeof candidate.variantId !== 'string'
    ) {
      continue;
    }
    if (typeof candidate.quantity !== 'number' || !Number.isInteger(candidate.quantity)) {
      continue;
    }
    if (candidate.quantity < 1 || candidate.quantity > MAX_QUANTITY) continue;

    const product = context.products.find((item) => item.id === candidate.productId);
    if (!product) continue;
    if (modelId) {
      const model = context.models.find((item) => item.id === modelId);
      if (!model) continue;
      if (!product.compatibleModels.includes(model.id)) continue;
    }

    let variantId = (candidate.variantId as string | null | undefined) ?? null;
    if (product.variants.length > 0) {
      if (!variantId || !product.variants.some((variant) => variant.id === variantId)) continue;
    } else {
      variantId = null;
    }

    cart = addItem(cart, {
      productId: product.id,
      modelId,
      variantId,
      quantity: candidate.quantity,
    });
  }
  return cart;
}

export function loadCartFromStorage(storage?: StorageLike): CartItem[] {
  const target = storage ?? getLocalStorage();
  if (!target) return [];
  try {
    return hydrateCart(target.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveCartToStorage(cart: CartItem[], storage?: StorageLike): void {
  const target = storage ?? getLocalStorage();
  if (!target) return;
  try {
    target.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Armazenamento indisponível (modo privado/cota cheia): a loja continua funcionando.
  }
}

export function loadSelectedModel(storage?: StorageLike): string | null {
  const target = storage ?? getLocalStorage();
  if (!target) return null;
  try {
    const value = target.getItem(MODEL_STORAGE_KEY);
    return value && catalog.models.some((model) => model.id === value) ? value : null;
  } catch {
    return null;
  }
}

export function saveSelectedModel(modelId: string | null, storage?: StorageLike): void {
  const target = storage ?? getLocalStorage();
  if (!target) return;
  try {
    if (modelId) target.setItem(MODEL_STORAGE_KEY, modelId);
    else target.removeItem(MODEL_STORAGE_KEY);
  } catch {
    // Ignora falhas de armazenamento.
  }
}

export function loadBuyerName(storage?: StorageLike): string {
  const target = storage ?? getLocalStorage();
  if (!target) return '';
  try {
    return target.getItem(BUYER_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveBuyerName(name: string, storage?: StorageLike): void {
  const target = storage ?? getLocalStorage();
  if (!target) return;
  try {
    target.setItem(BUYER_STORAGE_KEY, name);
  } catch {
    // Ignora falhas de armazenamento.
  }
}

export function createOrderId(date = new Date()): string {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0');
  return `LS-${year}${month}${day}-${random}`;
}

function getLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
