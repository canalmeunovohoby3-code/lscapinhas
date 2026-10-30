import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import iphone16ProMaxManifest from '../../public/mockups/iphone-16-pro-max/manifest.json';
import iphone16ProManifest from '../../public/mockups/iphone-16-pro/manifest.json';
import galaxyS23Manifest from '../../public/mockups/galaxy-s23/manifest.json';
import motoG84Manifest from '../../public/mockups/moto-g84/manifest.json';
import redmiNote14Manifest from '../../public/mockups/redmi-note-14/manifest.json';
import {
  MOCKUP_REGISTRY,
  getDefaultMockupModelId,
  getMockupEntry,
  resolveMockup,
} from './registry';

const manifests = new Map([
  ['/mockups/iphone-16-pro-max/manifest.json', iphone16ProMaxManifest],
  ['/mockups/iphone-16-pro/manifest.json', iphone16ProManifest],
  ['/mockups/galaxy-s23/manifest.json', galaxyS23Manifest],
  ['/mockups/moto-g84/manifest.json', motoG84Manifest],
  ['/mockups/redmi-note-14/manifest.json', redmiNote14Manifest],
]);

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const body = manifests.get(String(input));
  return body
    ? new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    : new Response('not found', { status: 404 });
});

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mockup registry', () => {
  it('registra os mockups disponíveis e mantém o iPhone 16 Pro Max como padrão', () => {
    expect(MOCKUP_REGISTRY).toHaveLength(340);
    expect(getMockupEntry('iphone-16-pro-max')?.mockupId).toBe('iphone-16-pro-max');
    expect(getMockupEntry('galaxy-s23')?.mockupId).toBe('galaxy-s23');
    expect(getMockupEntry('moto-g84')?.mockupId).toBe('moto-g84');
    expect(getMockupEntry('redmi-note-14')?.mockupId).toBe('redmi-note-14');
    expect(getDefaultMockupModelId()).toBe('iphone-16-pro-max');
  });

  it('resolve cada modelId e carrega o manifesto real correspondente', async () => {
    for (const entry of MOCKUP_REGISTRY.filter((entry) => ['iphone-16-pro-max', 'iphone-16-pro', 'galaxy-s23', 'moto-g84', 'redmi-note-14'].includes(entry.modelId))) {
      const device = await resolveMockup(entry.modelId);

      expect(device).not.toBeNull();
      expect(device?.id).toBe(entry.modelId);
      expect(device?.mockupWidth).toBe(280);
      expect(device?.mockupHeight).toBe(560);
      expect(device?.version).toBe('1.0.0');
      expect(device?.baseImage).toBe(`${entry.assetBase}/base.png`);
      expect(device?.maskImage).toBe(`${entry.assetBase}/print-mask.png`);
      expect(device?.cameraImage).toBe(`${entry.assetBase}/camera.png`);
      expect(device?.borderImage).toBe(`${entry.assetBase}/border.png`);
      expect(device?.exportConfig).toMatchObject({
        canvas: { width: 1600, height: 2400 },
        fit: 'contain',
        box: { x: 200, y: 0, width: 1200, height: 2400 },
      });
    }

    const s23 = await resolveMockup('galaxy-s23');
    expect(s23?.printArea).toEqual({ x: 12, y: 20, width: 254, height: 521 });
    expect(s23?.cameraBounds).toEqual({ x: 33, y: 36, width: 91, height: 166 });
  });

  it('não busca manifesto para modelId sem mockup e retorna indisponibilidade', async () => {
    const device = await resolveMockup('poco-m6');

    expect(device).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não resolve ids vazios', async () => {
    await expect(resolveMockup(null)).resolves.toBeNull();
    await expect(resolveMockup('')).resolves.toBeNull();
  });
});
