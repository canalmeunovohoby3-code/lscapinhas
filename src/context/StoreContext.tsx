import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PhoneModel, RequestItem } from '../types/catalog';
import { catalog } from '../data/catalog';
import { loadSelectedModel, saveSelectedModel } from '../lib/cart';
import {
  addRequestItem as addRequestItemToRequest,
  loadRequest,
  loadRequestNotes,
  removeRequestItem as removeRequestItemFromRequest,
  saveRequest,
  saveRequestNotes,
  updateRequestQuantity as updateRequestQuantityInRequest,
} from '../lib/request';

interface ToastState {
  id: number;
  message: string;
}

interface StoreContextValue {
  requestItems: RequestItem[];
  requestCount: number;
  requestNotes: string;
  setRequestNotes: (notes: string) => void;
  addRequestItem: (modelId: string, quantity: number) => boolean;
  updateRequestQuantity: (modelId: string, quantity: number) => void;
  removeRequestItem: (modelId: string) => void;
  clearRequest: () => void;
  selectedModelId: string | null;
  selectedModel: PhoneModel | undefined;
  setSelectedModel: (modelId: string | null) => void;
  toast: ToastState | null;
  notify: (message: string) => void;
  dismissToast: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requestItems, setRequestItems] = useState<RequestItem[]>(() => loadRequest());
  const [requestNotes, setRequestNotesState] = useState<string>(() => loadRequestNotes());
  const [selectedModelId, setSelectedModelIdState] = useState<string | null>(() =>
    loadSelectedModel(),
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    saveRequest(requestItems);
  }, [requestItems]);

  useEffect(() => {
    saveRequestNotes(requestNotes);
  }, [requestNotes]);

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

  const addRequestItem = useCallback(
    (modelId: string, quantity: number): boolean => {
      const model = catalog.models.find((entry) => entry.id === modelId);
      if (!model) return false;
      if (!Number.isFinite(quantity) || quantity < 1) return false;

      setRequestItems((current) => addRequestItemToRequest(current, modelId, quantity));
      notify(`${model.name} adicionado à solicitação.`);
      return true;
    },
    [notify],
  );

  const updateRequestQuantity = useCallback((modelId: string, quantity: number) => {
    setRequestItems((current) => updateRequestQuantityInRequest(current, modelId, quantity));
  }, []);

  const removeRequestItem = useCallback((modelId: string) => {
    setRequestItems((current) => removeRequestItemFromRequest(current, modelId));
  }, []);

  const clearRequest = useCallback(() => {
    setRequestItems([]);
    setRequestNotesState('');
  }, []);

  const setRequestNotes = useCallback((notes: string) => {
    setRequestNotesState(notes);
  }, []);

  const requestCount = useMemo(
    () => requestItems.reduce((sum, item) => sum + item.quantity, 0),
    [requestItems],
  );
  const selectedModel = useMemo(
    () => catalog.models.find((model) => model.id === selectedModelId),
    [selectedModelId],
  );

  const value: StoreContextValue = {
    requestItems,
    requestCount,
    requestNotes,
    setRequestNotes,
    addRequestItem,
    updateRequestQuantity,
    removeRequestItem,
    clearRequest,
    selectedModelId,
    selectedModel,
    setSelectedModel,
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
