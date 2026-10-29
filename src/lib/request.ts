import type { PhoneModel, RequestItem } from '../types/catalog';
import { catalog } from '../data/catalog';

export const REQUEST_STORAGE_KEY = 'lscase:request:v1';
export const REQUEST_NOTES_STORAGE_KEY = 'lscase:request-notes:v1';
export const LEGACY_CART_STORAGE_KEY = 'lscase:cart:v1';
export const MAX_REQUEST_QUANTITY = 99;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function clampQuantity(quantity: number): number {
  return Math.min(MAX_REQUEST_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

function isKnownModel(modelId: string, models: PhoneModel[]): boolean {
  return models.some((model) => model.id === modelId);
}

export function addRequestItem(
  items: RequestItem[],
  modelId: string,
  quantity: number,
  models: PhoneModel[] = catalog.models,
): RequestItem[] {
  if (!isKnownModel(modelId, models)) return items;
  if (!Number.isFinite(quantity) || quantity < 1) return items;

  const nextQuantity = clampQuantity(quantity);
  const existing = items.find((item) => item.modelId === modelId);

  if (existing) {
    return items.map((item) =>
      item.modelId === modelId
        ? {
            ...item,
            quantity: Math.min(MAX_REQUEST_QUANTITY, item.quantity + nextQuantity),
          }
        : item,
    );
  }

  return [...items, { modelId, quantity: nextQuantity }];
}

export function updateRequestQuantity(
  items: RequestItem[],
  modelId: string,
  quantity: number,
): RequestItem[] {
  if (quantity <= 0) return removeRequestItem(items, modelId);
  const nextQuantity = clampQuantity(quantity);
  return items.map((item) =>
    item.modelId === modelId ? { ...item, quantity: nextQuantity } : item,
  );
}

export function removeRequestItem(items: RequestItem[], modelId: string): RequestItem[] {
  return items.filter((item) => item.modelId !== modelId);
}

export function requestTotals(items: RequestItem[]): {
  modelCount: number;
  unitCount: number;
} {
  return items.reduce(
    (acc, item) => {
      acc.modelCount += 1;
      acc.unitCount += item.quantity;
      return acc;
    },
    { modelCount: 0, unitCount: 0 },
  );
}

export function hydrateRequest(
  raw: string | null,
  models: PhoneModel[] = catalog.models,
): RequestItem[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  let items: RequestItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.modelId !== 'string' || !candidate.modelId) continue;
    if (
      typeof candidate.quantity !== 'number' ||
      !Number.isInteger(candidate.quantity) ||
      candidate.quantity < 1 ||
      candidate.quantity > MAX_REQUEST_QUANTITY
    ) {
      continue;
    }
    items = addRequestItem(items, candidate.modelId, candidate.quantity, models);
  }
  return items;
}

function hydrateLegacyCart(
  raw: string | null,
  models: PhoneModel[] = catalog.models,
): RequestItem[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  let items: RequestItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.modelId !== 'string' || !candidate.modelId) continue;
    if (
      typeof candidate.quantity !== 'number' ||
      !Number.isInteger(candidate.quantity) ||
      candidate.quantity < 1
    ) {
      continue;
    }
    items = addRequestItem(items, candidate.modelId, candidate.quantity, models);
  }
  return items;
}

export function loadRequest(storage?: StorageLike): RequestItem[] {
  const target = storage ?? getLocalStorage();
  if (!target) return [];
  try {
    const raw = target.getItem(REQUEST_STORAGE_KEY);
    if (raw !== null) return hydrateRequest(raw);
    return hydrateLegacyCart(target.getItem(LEGACY_CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveRequest(items: RequestItem[], storage?: StorageLike): void {
  const target = storage ?? getLocalStorage();
  if (!target) return;
  try {
    target.setItem(REQUEST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Armazenamento indisponível: a solicitação continua funcionando na sessão.
  }
}

export function loadRequestNotes(storage?: StorageLike): string {
  const target = storage ?? getLocalStorage();
  if (!target) return '';
  try {
    return target.getItem(REQUEST_NOTES_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveRequestNotes(notes: string, storage?: StorageLike): void {
  const target = storage ?? getLocalStorage();
  if (!target) return;
  try {
    if (notes) target.setItem(REQUEST_NOTES_STORAGE_KEY, notes);
    else target.removeItem(REQUEST_NOTES_STORAGE_KEY);
  } catch {
    // Ignora falhas de armazenamento.
  }
}

function getLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
