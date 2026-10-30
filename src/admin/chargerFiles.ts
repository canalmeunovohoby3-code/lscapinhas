import { ALLOWED_IMAGE_TYPES, validateOrderImages } from '../lib/orderForm';
import type { ImageLike } from '../lib/orderForm';

const EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAllowedType(type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateChargerImage(file: ImageLike): string | null {
  return validateOrderImages([file]);
}

export function createChargerImagePath(
  file: Pick<ImageLike, 'type'>,
  fileId: string = crypto.randomUUID(),
): string {
  const normalizedFile = fileId.trim().toLowerCase();

  if (!isAllowedType(file.type)) {
    throw new Error('Formato de imagem inválido.');
  }

  if (!UUID_PATTERN.test(normalizedFile)) {
    throw new Error('Identificador de arquivo inválido.');
  }

  return `chargers/${normalizedFile}.${EXTENSIONS[file.type]}`;
}
