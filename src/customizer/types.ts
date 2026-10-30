export type CustomizerStep = 'case' | 'photos' | 'adjust';
export type RotationDirection = 'left' | 'right';

export interface CustomizerImage {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  blob: Blob;
  placement: Placement;
  savedPlacement: Placement;
  applied: boolean;
  order: number;
}

export interface Placement {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MockupExportConfig {
  canvas: {
    width: number;
    height: number;
  };
  fit: 'contain';
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  upscale: number;
  note?: string;
}

export interface MockupLayer {
  name: 'base' | 'mask' | 'photo' | 'camera' | 'border';
  file: string | null;
  role: string;
}

export interface MockupManifest {
  id: string;
  version: string;
  brand: string;
  model: string;
  nativeSize: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  printArea: PrintArea;
  cameraBounds: PrintArea;
  layers: MockupLayer[];
  export: MockupExportConfig;
}

export interface MockupRegistryEntry {
  modelId: string;
  mockupId: string;
  assetBase: string;
  manifestPath: string;
  material: string;
  layout: string;
  isDefault?: boolean;
}

export interface CustomizerDevice {
  id: string;
  brand: string;
  model: string;
  material: string;
  layout: string;
  mockupWidth: number;
  mockupHeight: number;
  baseImage: string;
  maskImage: string;
  cameraImage: string;
  borderImage: string;
  printArea: PrintArea;
  cameraBounds: PrintArea;
  exportConfig: MockupExportConfig;
  version: string;
}

export const MIN_SCALE = 0.5;
export const MAX_SCALE = 4;
export const REFERENCE_PHOTO_HEIGHT = 558;
export const MAX_IMAGES = 1;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export const DEFAULT_PLACEMENT: Placement = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};
