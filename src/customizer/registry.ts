import { getBrandById, getModelById } from '../data/catalog';
import { MOCKUP_REGISTRY_DATA } from './mockupRegistryData';
import type {
  CustomizerDevice,
  MockupLayer,
  MockupManifest,
  MockupRegistryEntry,
  PrintArea,
} from './types';

export const MOCKUP_REGISTRY: readonly MockupRegistryEntry[] = MOCKUP_REGISTRY_DATA;

const manifestCache = new Map<string, Promise<MockupManifest>>();

export function getMockupEntry(modelId: string | null | undefined): MockupRegistryEntry | null {
  if (!modelId) return null;
  const normalized = modelId.trim();
  return MOCKUP_REGISTRY.find((entry) => entry.modelId === normalized) ?? null;
}

export function getDefaultMockupModelId(): string | null {
  return (MOCKUP_REGISTRY.find((entry) => entry.isDefault) ?? MOCKUP_REGISTRY[0])?.modelId ?? null;
}

function isPrintArea(value: unknown): value is PrintArea {
  if (!value || typeof value !== 'object') return false;
  const area = value as Record<string, unknown>;
  return (
    typeof area.x === 'number' &&
    typeof area.y === 'number' &&
    typeof area.width === 'number' &&
    typeof area.height === 'number' &&
    area.width > 0 &&
    area.height > 0
  );
}

function validateManifest(manifest: MockupManifest): void {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifesto de mockup inválido.');
  }

  if (typeof manifest.id !== 'string' || typeof manifest.version !== 'string') {
    throw new Error('Manifesto sem id ou versão.');
  }

  if (
    !manifest.nativeSize ||
    !Number.isFinite(manifest.nativeSize.width) ||
    !Number.isFinite(manifest.nativeSize.height) ||
    manifest.nativeSize.width <= 0 ||
    manifest.nativeSize.height <= 0
  ) {
    throw new Error('Dimensões nativas inválidas no manifesto.');
  }

  if (!isPrintArea(manifest.printArea) || !isPrintArea(manifest.cameraBounds)) {
    throw new Error('Áreas do manifesto inválidas.');
  }

  if (
    !manifest.export?.canvas ||
    !manifest.export.box ||
    manifest.export.canvas.width <= 0 ||
    manifest.export.canvas.height <= 0 ||
    manifest.export.box.width <= 0 ||
    manifest.export.box.height <= 0
  ) {
    throw new Error('Configuração de exportação inválida no manifesto.');
  }

  for (const name of ['base', 'mask', 'camera', 'border']) {
    const layer = manifest.layers?.find((entry) => entry.name === name);
    if (!layer?.file) {
      throw new Error(`Camada ${name} ausente no manifesto.`);
    }
  }
}

function layerFile(manifest: MockupManifest, name: MockupLayer['name']): string {
  const layer = manifest.layers.find((entry) => entry.name === name);

  if (!layer?.file) {
    throw new Error(`Camada ${name} ausente no manifesto.`);
  }

  return layer.file;
}

async function loadManifest(entry: MockupRegistryEntry): Promise<MockupManifest> {
  const cached = manifestCache.get(entry.manifestPath);
  if (cached) return cached;

  const request = fetch(entry.manifestPath, { cache: 'no-cache' }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Não foi possível carregar o manifesto (${response.status}).`);
    }

    const manifest = (await response.json()) as MockupManifest;
    validateManifest(manifest);

    if (manifest.id !== entry.mockupId) {
      throw new Error('O manifesto não corresponde ao mockup registrado.');
    }

    return manifest;
  });

  manifestCache.set(entry.manifestPath, request);

  try {
    return await request;
  } catch (error) {
    manifestCache.delete(entry.manifestPath);
    throw error;
  }
}

function buildDevice(entry: MockupRegistryEntry, manifest: MockupManifest): CustomizerDevice {
  const model = getModelById(entry.modelId);
  const brand = model ? getBrandById(model.brandId) : undefined;

  if (!model || !brand) {
    throw new Error(`Modelo ${entry.modelId} não encontrado no catálogo.`);
  }

  const assetPath = (name: MockupLayer['name']) => `${entry.assetBase}/${layerFile(manifest, name)}`;

  return {
    id: entry.modelId,
    brand: brand.shortName,
    model: model.name,
    material: entry.material,
    layout: entry.layout,
    mockupWidth: manifest.nativeSize.width,
    mockupHeight: manifest.nativeSize.height,
    baseImage: assetPath('base'),
    maskImage: assetPath('mask'),
    cameraImage: assetPath('camera'),
    borderImage: assetPath('border'),
    printArea: manifest.printArea,
    cameraBounds: manifest.cameraBounds,
    exportConfig: manifest.export,
    version: manifest.version,
  };
}

export async function resolveMockup(
  modelId: string | null | undefined,
): Promise<CustomizerDevice | null> {
  const entry = getMockupEntry(modelId);
  if (!entry) return null;

  const manifest = await loadManifest(entry);
  return buildDevice(entry, manifest);
}
