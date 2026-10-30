import type { CustomizerImage, Placement } from './types';

export function patchImage(
  images: CustomizerImage[],
  imageId: string,
  patch: Partial<CustomizerImage>,
): CustomizerImage[] {
  return images.map((image) => (image.id === imageId ? { ...image, ...patch } : image));
}

export function updateImagePlacement(
  images: CustomizerImage[],
  imageId: string,
  placement: Placement,
): CustomizerImage[] {
  return patchImage(images, imageId, { placement });
}

export function saveImagePlacement(
  images: CustomizerImage[],
  imageId: string,
  placement: Placement,
): CustomizerImage[] {
  return patchImage(images, imageId, {
    placement,
    savedPlacement: { ...placement },
  });
}

export function markImageApplied(
  images: CustomizerImage[],
  imageId: string,
): CustomizerImage[] {
  return patchImage(images, imageId, { applied: true });
}
