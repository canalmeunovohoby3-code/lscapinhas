import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  MAX_SCALE,
  MIN_SCALE,
  REFERENCE_PHOTO_HEIGHT,
} from './types';

export interface ImageFileLike {
  name: string;
  size: number;
  type: string;
}

export function validateCustomizerImages(
  files: readonly ImageFileLike[],
  existingCount = 0,
): string | null {
  if (existingCount + files.length > MAX_IMAGES) {
    return MAX_IMAGES === 1
      ? 'Você pode adicionar somente uma fotografia por capinha.'
      : `Você pode adicionar no máximo ${MAX_IMAGES} fotos.`;
  }

  for (const file of files) {
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return `A imagem "${file.name}" não está em JPEG, PNG ou WebP.`;
    }

    if (file.size <= 0) {
      return `A imagem "${file.name}" está vazia.`;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return `A imagem "${file.name}" excede o limite de 10 MB.`;
    }
  }

  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

export function nextRotation(rotation: number, direction: 'left' | 'right'): number {
  return normalizeRotation(rotation + (direction === 'right' ? 90 : -90));
}

export function getRotationCoverScale(
  rotation: number,
  width: number,
  height: number,
): number {
  if (width <= 0 || height <= 0) return 1;

  const radians = (normalizeRotation(rotation) * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  const rotatedWidth = width * cosine + height * sine;
  const rotatedHeight = width * sine + height * cosine;

  return Math.max(width / rotatedWidth, height / rotatedHeight, 1);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildExportFileName(deviceId: string): string {
  return `lscase-personalizador-${deviceId}.png`;
}

export interface CoverSourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function getContainScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }

  return Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
}

export function getCoverScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }

  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

export function getReferenceInitialScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }

  const coverScale = getCoverScale(imageWidth, imageHeight, frameWidth, frameHeight);
  const displayedHeight = imageHeight * coverScale;

  if (displayedHeight <= 0) return 1;

  return clamp(REFERENCE_PHOTO_HEIGHT / displayedHeight, MIN_SCALE, MAX_SCALE);
}

export function getCoverSourceRect(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): CoverSourceRect {
  if (imageWidth <= 0 || imageHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { sx: 0, sy: 0, sw: imageWidth, sh: imageHeight };
  }

  const imageRatio = imageWidth / imageHeight;
  const boxRatio = boxWidth / boxHeight;

  if (imageRatio > boxRatio) {
    const sw = imageHeight * boxRatio;
    return {
      sx: (imageWidth - sw) / 2,
      sy: 0,
      sw,
      sh: imageHeight,
    };
  }

  const sh = imageWidth / boxRatio;
  return {
    sx: 0,
    sy: (imageHeight - sh) / 2,
    sw: imageWidth,
    sh,
  };
}
