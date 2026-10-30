import { describe, expect, it, vi } from 'vitest';
import { buildDraft, loadDraft, restoreDraftImages, type CustomizerDraft } from './draftStore';
import { DEFAULT_PLACEMENT, type CustomizerDevice, type CustomizerImage } from './types';

const device: CustomizerDevice = {
  id: 'iphone-16-pro-max',
  brand: 'Apple',
  model: 'iPhone 16 Pro Max',
  material: 'TPU',
  layout: 'Traseira',
  mockupWidth: 280,
  mockupHeight: 560,
  baseImage: '/base.png',
  maskImage: '/mask.png',
  cameraImage: '/camera.png',
  borderImage: '/border.png',
  printArea: { x: 0, y: 0, width: 100, height: 200 },
  cameraBounds: { x: 0, y: 0, width: 50, height: 50 },
  exportConfig: {
    canvas: { width: 1600, height: 2400 },
    fit: 'contain',
    box: { x: 200, y: 0, width: 1200, height: 2400 },
    upscale: 1,
  },
  version: '1.0.0',
};

function image(id: string, order: number, applied = true): CustomizerImage {
  const placement = { ...DEFAULT_PLACEMENT, x: order / 10, scale: 1 + order / 10 };
  return {
    id,
    name: `${id}.png`,
    url: `blob:${id}`,
    size: 100,
    type: 'image/png',
    blob: new Blob(['foto'], { type: 'image/png' }),
    placement,
    savedPlacement: { ...placement },
    applied,
    order,
  };
}

describe('customizer draft serialization', () => {
  it('monta o rascunho com blobs, ajustes individuais e referências do mockup', () => {
    const draft = buildDraft(
      device,
      [image('one', 0), image('two', 1, false)],
      'two',
      'one',
      'adjust',
    );

    expect(draft).toMatchObject({
      modelId: 'iphone-16-pro-max',
      mockupId: 'iphone-16-pro-max',
      manifestVersion: '1.0.0',
      selectedId: 'two',
      activeId: 'one',
      step: 'adjust',
    });
    expect(draft.images).toHaveLength(1);
    expect('url' in draft.images[0]).toBe(false);
    expect(draft.images[0].placement).toEqual(
      expect.objectContaining({ x: 0, scale: 1 }),
    );
  });

  it('restaura blobs em novas URLs e mantém o enquadramento de cada foto', () => {
    const draft: CustomizerDraft = {
      ...buildDraft(
        device,
        [image('one', 0), image('two', 1, false)],
        'two',
        'one',
        'adjust',
      ),
      images: [
        {
          id: 'two',
          name: 'two.png',
          size: 100,
          type: 'image/png',
          blob: new Blob(['dois'], { type: 'image/png' }),
          placement: { x: 0.2, y: -0.1, scale: 1.5, rotation: 90 },
          savedPlacement: { x: 0.2, y: -0.1, scale: 1.5, rotation: 90 },
          applied: false,
          order: 1,
        },
        {
          id: 'one',
          name: 'one.png',
          size: 100,
          type: 'image/png',
          blob: new Blob(['um'], { type: 'image/png' }),
          placement: { x: -0.2, y: 0.1, scale: 0.8, rotation: 270 },
          savedPlacement: { x: -0.2, y: 0.1, scale: 0.8, rotation: 270 },
          applied: true,
          order: 0,
        },
      ],
    };
    const createObjectUrl = vi.fn((_blob: Blob) => `blob:restored-${_blob.size}`);

    const result = restoreDraftImages(draft, createObjectUrl);

    expect(result.skipped).toBe(1);
    expect(result.images.map((entry) => entry.id)).toEqual(['one']);
    expect(result.images[0].placement).toEqual({
      x: -0.2,
      y: 0.1,
      scale: 0.8,
      rotation: 270,
    });
    expect(result.images[0].url).toMatch(/^blob:restored-/);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('ignora apenas a foto inválida e preserva as outras', () => {
    const draft: CustomizerDraft = {
      ...buildDraft(device, [image('one', 0)], 'one', 'one', 'adjust'),
      images: [
        {
          id: 'bad',
          name: 'bad.png',
          size: 10,
          type: 'image/png',
          blob: undefined as unknown as Blob,
          placement: DEFAULT_PLACEMENT,
          savedPlacement: DEFAULT_PLACEMENT,
          applied: false,
          order: 0,
        },
        {
          id: 'good',
          name: 'good.png',
          size: 100,
          type: 'image/png',
          blob: new Blob(['ok'], { type: 'image/png' }),
          placement: DEFAULT_PLACEMENT,
          savedPlacement: DEFAULT_PLACEMENT,
          applied: true,
          order: 1,
        },
      ],
    };

    const result = restoreDraftImages(draft, () => 'blob:good');

    expect(result.skipped).toBe(1);
    expect(result.images.map((entry) => entry.id)).toEqual(['good']);
  });

  it('reporta armazenamento local indisponível sem derrubar o editor', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await expect(loadDraft('iphone-16-pro-max')).rejects.toThrow(/IndexedDB/);

    vi.unstubAllGlobals();
  });

  it('normaliza ajustes corrompidos ao recuperar', () => {
    const draft: CustomizerDraft = {
      ...buildDraft(device, [image('one', 0)], 'one', 'one', 'adjust'),
      images: [
        {
          id: 'one',
          name: 'one.png',
          size: 100,
          type: 'image/png',
          blob: new Blob(['ok'], { type: 'image/png' }),
          placement: { x: 99, y: -99, scale: 99, rotation: -90 },
          savedPlacement: { x: 99, y: -99, scale: 99, rotation: -90 },
          applied: true,
          order: 0,
        },
      ],
    };

    const result = restoreDraftImages(draft, () => 'blob:one');

    expect(result.images[0].placement).toEqual({
      x: 1,
      y: -1,
      scale: 4,
      rotation: 270,
    });
  });
});
