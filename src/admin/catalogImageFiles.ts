import { CATALOG_IMAGE_BUCKET, getCatalogImageUrl } from '../lib/catalogImages';
import {
  ALLOWED_IMAGE_TYPES,
  validateOrderImages,
  type ImageLike,
} from '../lib/orderForm';

export const MAX_CATALOG_IMAGES = 12;

const EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_PATTERN = /^[a-z0-9-]+$/;

function isAllowedType(type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateCatalogImageFiles(
  files: readonly ImageLike[],
  existingCount = 0,
): string | null {
  if (existingCount + files.length > MAX_CATALOG_IMAGES) {
    return `Cada modelo pode ter no máximo ${MAX_CATALOG_IMAGES} fotos.`;
  }

  return validateOrderImages(files);
}

export function createCatalogImagePath(
  brandId: string,
  modelId: string,
  file: Pick<ImageLike, 'type'>,
  fileId: string = crypto.randomUUID(),
): string {
  const normalizedBrand = brandId.trim().toLowerCase();
  const normalizedModel = modelId.trim().toLowerCase();
  const normalizedFile = fileId.trim().toLowerCase();

  if (!ID_PATTERN.test(normalizedBrand) || !ID_PATTERN.test(normalizedModel)) {
    throw new Error('Marca ou modelo inválido para a foto.');
  }

  if (!isAllowedType(file.type)) {
    throw new Error('Formato de imagem inválido.');
  }

  if (!UUID_PATTERN.test(normalizedFile)) {
    throw new Error('Identificador de arquivo inválido.');
  }

  return `catalog/${normalizedBrand}/${normalizedModel}/${normalizedFile}.${EXTENSIONS[file.type]}`;
}

export { CATALOG_IMAGE_BUCKET, getCatalogImageUrl };
