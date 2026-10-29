import type { RequestItem } from '../types/catalog';
import { getBrandForModel, getModelById } from '../data/catalog';

export const MAX_IMAGES = 12;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_NAME_LENGTH = 120;
export const MAX_CONTACT_LENGTH = 80;
export const MAX_NOTES_LENGTH = 1_000;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const IMAGE_EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ImageLike {
  name: string;
  size: number;
  type: string;
}

export interface OrderItemPayload {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  quantity: number;
}

export interface OrderImagePayload {
  path: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface OrderFormInput {
  customerName: string;
  customerContact: string;
  notes: string;
  items: readonly RequestItem[];
  images: readonly ImageLike[];
}

export interface OrderFormErrors {
  customerName?: string;
  customerContact?: string;
  notes?: string;
  items?: string;
  images?: string;
}

export interface OrderSubmissionInput<TFile extends ImageLike> {
  customerName: string;
  customerContact: string;
  notes: string;
  items: OrderItemPayload[];
  images: readonly TFile[];
}

export interface OrderSubmissionDeps<TFile extends ImageLike> {
  createOrder: (payload: {
    customerName: string;
    customerContact: string;
    notes: string;
    items: OrderItemPayload[];
  }) => Promise<string>;
  uploadImage: (path: string, file: TFile) => Promise<void>;
  attachImages: (orderId: string, images: OrderImagePayload[]) => Promise<void>;
  makePath: (orderId: string, file: TFile) => string;
  onProgress?: (current: number, total: number) => void;
}

export interface OrderSubmissionResult {
  orderId: string;
  uploaded: OrderImagePayload[];
  failedImages: string[];
  attachError: string | null;
}

function isAllowedImageType(type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateOrderImages(files: readonly ImageLike[]): string | null {
  if (files.length > MAX_IMAGES) {
    return `Envie no máximo ${MAX_IMAGES} imagens.`;
  }

  for (const file of files) {
    if (!isAllowedImageType(file.type)) {
      return `A imagem "${file.name}" não está em JPEG, PNG ou WebP.`;
    }

    if (file.size <= 0) {
      return `A imagem "${file.name}" está vazia.`;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return `A imagem "${file.name}" excede o limite de 10 MB.`;
    }
  }

  return null;
}

export function buildOrderItems(items: readonly RequestItem[]): OrderItemPayload[] {
  return items.map((item) => {
    const model = getModelById(item.modelId);
    const brand = getBrandForModel(item.modelId);

    if (!model || !brand) {
      throw new Error('Um dos modelos selecionados não está mais disponível.');
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error('Revise a quantidade dos modelos selecionados.');
    }

    return {
      brandId: brand.id,
      brandName: brand.name,
      modelId: model.id,
      modelName: model.name,
      quantity: item.quantity,
    };
  });
}

export function createStoragePath(
  orderId: string,
  file: Pick<ImageLike, 'type'>,
  fileId: string = crypto.randomUUID(),
): string {
  const normalizedOrderId = orderId.trim().toLowerCase();
  const normalizedFileId = fileId.trim().toLowerCase();

  if (!UUID_PATTERN.test(normalizedOrderId)) {
    throw new Error('Identificador do pedido inválido.');
  }

  if (!isAllowedImageType(file.type)) {
    throw new Error('Formato de imagem inválido.');
  }

  if (!UUID_PATTERN.test(normalizedFileId)) {
    throw new Error('Identificador do arquivo inválido.');
  }

  return `orders/${normalizedOrderId}/${normalizedFileId}.${IMAGE_EXTENSIONS[file.type]}`;
}

export function validateOrderForm(input: OrderFormInput): OrderFormErrors {
  const errors: OrderFormErrors = {};
  const name = input.customerName.trim();
  const contact = input.customerContact.trim();

  if (!name) {
    errors.customerName = 'Informe seu nome.';
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.customerName = `Use no máximo ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!contact) {
    errors.customerContact = 'Informe um telefone ou WhatsApp para contato.';
  } else if (contact.length > MAX_CONTACT_LENGTH) {
    errors.customerContact = `Use no máximo ${MAX_CONTACT_LENGTH} caracteres.`;
  }

  if (input.notes.trim().length > MAX_NOTES_LENGTH) {
    errors.notes = `Use no máximo ${MAX_NOTES_LENGTH} caracteres.`;
  }

  if (input.items.length === 0) {
    errors.items = 'Adicione pelo menos um modelo ao pedido.';
  } else if (
    input.items.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99,
    )
  ) {
    errors.items = 'Revise a quantidade dos modelos selecionados.';
  }

  const imageError = validateOrderImages(input.images);

  if (imageError) {
    errors.images = imageError;
  }

  return errors;
}

export async function submitOrder<TFile extends ImageLike>(
  input: OrderSubmissionInput<TFile>,
  deps: OrderSubmissionDeps<TFile>,
): Promise<OrderSubmissionResult> {
  const orderId = await deps.createOrder({
    customerName: input.customerName,
    customerContact: input.customerContact,
    notes: input.notes,
    items: input.items,
  });

  if (!orderId) {
    throw new Error('O servidor não retornou o código do pedido.');
  }

  const uploaded: OrderImagePayload[] = [];
  const failedImages: string[] = [];

  for (let index = 0; index < input.images.length; index += 1) {
    const file = input.images[index];
    deps.onProgress?.(index + 1, input.images.length);

    try {
      const path = deps.makePath(orderId, file);
      await deps.uploadImage(path, file);
      uploaded.push({
        path,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
    } catch {
      failedImages.push(file.name);
    }
  }

  let attachError: string | null = null;

  if (uploaded.length > 0) {
    try {
      await deps.attachImages(orderId, uploaded);
    } catch {
      attachError = 'As imagens foram enviadas, mas não puderam ser registradas no pedido.';
    }
  }

  return {
    orderId,
    uploaded,
    failedImages,
    attachError,
  };
}
