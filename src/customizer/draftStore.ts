import { clamp, normalizeRotation } from './imageUtils';
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_PLACEMENT,
  MAX_IMAGES,
  MAX_SCALE,
  MIN_SCALE,
  type CustomizerDevice,
  type CustomizerImage,
  type CustomizerStep,
  type Placement,
} from './types';

export const DRAFT_DB_NAME = 'lscase-customizer-drafts';
export const DRAFT_DB_VERSION = 1;
export const DRAFT_STORE_NAME = 'drafts';

export interface DraftImage {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  placement: Placement;
  savedPlacement: Placement;
  applied: boolean;
  order: number;
}

export interface CustomizerDraft {
  modelId: string;
  mockupId: string;
  manifestVersion: string;
  images: DraftImage[];
  selectedId: string | null;
  activeId: string | null;
  step: CustomizerStep;
  updatedAt: number;
}

export function sanitizePlacement(value: Partial<Placement> | null | undefined): Placement {
  const candidate = value ?? DEFAULT_PLACEMENT;

  return {
    x: Number.isFinite(candidate.x) ? clamp(candidate.x ?? 0, -1, 1) : 0,
    y: Number.isFinite(candidate.y) ? clamp(candidate.y ?? 0, -1, 1) : 0,
    scale: Number.isFinite(candidate.scale)
      ? clamp(candidate.scale ?? DEFAULT_PLACEMENT.scale, MIN_SCALE, MAX_SCALE)
      : DEFAULT_PLACEMENT.scale,
    rotation: Number.isFinite(candidate.rotation)
      ? normalizeRotation(candidate.rotation ?? 0)
      : 0,
  };
}

export function buildDraft(
  device: CustomizerDevice,
  images: CustomizerImage[],
  selectedId: string | null,
  activeId: string | null,
  step: CustomizerStep,
): CustomizerDraft {
  return {
    modelId: device.id,
    mockupId: device.id,
    manifestVersion: device.version,
    images: images.slice(0, MAX_IMAGES).map((image) => ({
      id: image.id,
      name: image.name,
      size: image.size,
      type: image.type,
      blob: image.blob,
      placement: { ...image.placement },
      savedPlacement: { ...image.savedPlacement },
      applied: image.applied,
      order: image.order,
    })),
    selectedId,
    activeId,
    step,
    updatedAt: Date.now(),
  };
}

export function restoreDraftImages(
  draft: CustomizerDraft,
  createObjectUrl: (blob: Blob) => string = (blob) => URL.createObjectURL(blob),
): { images: CustomizerImage[]; skipped: number } {
  let skipped = 0;
  const images: CustomizerImage[] = [];

  const storedImages = [...(draft.images ?? [])].sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0),
  );

  for (const stored of storedImages) {
    if (images.length >= MAX_IMAGES) {
      skipped += 1;
      continue;
    }

    const validBlob =
      stored &&
      typeof stored.id === 'string' &&
      stored.blob instanceof Blob &&
      stored.blob.size > 0 &&
      ALLOWED_IMAGE_TYPES.includes(stored.type as (typeof ALLOWED_IMAGE_TYPES)[number]);

    if (!validBlob) {
      skipped += 1;
      continue;
    }

    try {
      images.push({
        id: stored.id,
        name: stored.name || 'Fotografia',
        size: stored.blob.size,
        type: stored.type,
        blob: stored.blob,
        url: createObjectUrl(stored.blob),
        placement: sanitizePlacement(stored.placement),
        savedPlacement: sanitizePlacement(stored.savedPlacement ?? stored.placement),
        applied: Boolean(stored.applied),
        order: Number.isFinite(stored.order) ? stored.order : images.length,
      });
    } catch {
      skipped += 1;
    }
  }

  images.sort((left, right) => left.order - right.order);

  return { images, skipped };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }

    const request = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        database.createObjectStore(DRAFT_STORE_NAME, { keyPath: 'modelId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o rascunho local.'));
  });
}

export async function loadDraft(modelId: string): Promise<CustomizerDraft | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, 'readonly');
    const request = transaction.objectStore(DRAFT_STORE_NAME).get(modelId);

    request.onsuccess = () => resolve((request.result as CustomizerDraft | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Falha ao ler o rascunho local.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Falha ao ler o rascunho local.'));
    };
  });
}

export async function saveDraft(draft: CustomizerDraft): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, 'readwrite');
    transaction.objectStore(DRAFT_STORE_NAME).put(draft);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Falha ao salvar o rascunho local.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Falha ao salvar o rascunho local.'));
    };
  });
}

export async function deleteDraft(modelId: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, 'readwrite');
    transaction.objectStore(DRAFT_STORE_NAME).delete(modelId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Falha ao apagar o rascunho local.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Falha ao apagar o rascunho local.'));
    };
  });
}
