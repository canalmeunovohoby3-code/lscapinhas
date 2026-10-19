import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, PhoneModel, Product, ProductVariant } from '../types/catalog';
import { catalog } from '../data/catalog';
import {
  addItem,
  cartTotals,
  loadCartFromStorage,
  loadSelectedModel,
  removeItem,
  resolveCart,
  saveCartToStorage,
  saveSelectedModel,
  setItemQuantity,
} from '../lib/cart';

interface AddToCartInput {
  product: Product;
  model: PhoneModel | null;
  variant: ProductVariant | null;
  quantity: number;
}

interface ToastState {
  id: number;
  message: string;
}

interface StoreContextValue {
  cart: CartItem[];
  resolvedCart: ReturnType<typeof resolveCart>;
  totals: ReturnType<typeof cartTotals>;
  cartCount: number;
  selectedModelId: string | null;
  selectedModel: PhoneModel | undefined;
  setSelectedModel: (modelId: string | null) => void;
  addToCart: (input: AddToCartInput) => boolean;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toast: ToastState | null;
  notify: (message: string) => void;
  dismissToast: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadCartFromStorage());
  const [selectedModelId, setSelectedModelIdState] = useState<string | null>(() =>
    loadSelectedModel(),
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  useEffect(() => {
    saveSelectedModel(selectedModelId);
  }, [selectedModelId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => {
    setToast({ id: Date.now() + Math.random(), message });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const setSelectedModel = useCallback((modelId: string | null) => {
    if (modelId && !catalog.models.some((model) => model.id === modelId)) return;
    setSelectedModelIdState(modelId);
  }, []);

  const addToCart = useCallback(
    ({ product, model, variant, quantity }: AddToCartInput): boolean => {
      if (!product.available) return false;
      if (product.variants.length > 0 && !variant) return false;
      if (!Number.isFinite(quantity) || quantity < 1) return false;

      const compatibleModel =
        model && product.compatibleModels.includes(model.id) ? model : null;

      setCart((current) =>
        addItem(current, {
          productId: product.id,
          modelId: compatibleModel?.id ?? null,
          variantId: variant?.id ?? null,
          quantity,
        }),
      );
      notify(`${product.name} foi adicionada ao carrinho.`);
      return true;
    },
    [notify],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setCart((current) => setItemQuantity(current, key, quantity));
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((current) => removeItem(current, key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const resolvedCart = useMemo(() => resolveCart(cart), [cart]);
  const totals = useMemo(() => cartTotals(resolvedCart), [resolvedCart]);
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );
  const selectedModel = useMemo(
    () => catalog.models.find((model) => model.id === selectedModelId),
    [selectedModelId],
  );

  const value: StoreContextValue = {
    cart,
    resolvedCart,
    totals,
    cartCount,
    selectedModelId,
    selectedModel,
    setSelectedModel,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toast,
    notify,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore precisa ser usado dentro de StoreProvider.');
  }
  return context;
}
