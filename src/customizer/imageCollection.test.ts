import { describe, expect, it } from 'vitest';
import {
  markImageApplied,
  patchImage,
  saveImagePlacement,
  updateImagePlacement,
} from './imageCollection';
import { DEFAULT_PLACEMENT, type CustomizerImage } from './types';

function image(id: string, order: number): CustomizerImage {
  return {
    id,
    name: `${id}.png`,
    url: `blob:${id}`,
    size: 100,
    type: 'image/png',
    blob: new Blob(['x'], { type: 'image/png' }),
    placement: { ...DEFAULT_PLACEMENT, x: order / 10 },
    savedPlacement: { ...DEFAULT_PLACEMENT, x: order / 10 },
    applied: true,
    order,
  };
}

describe('image collection state', () => {
  it('altera somente a fotografia indicada', () => {
    const first = image('one', 0);
    const second = image('two', 1);
    const changed = { ...first.placement, x: 0.4, y: -0.2, scale: 2, rotation: 90 };

    const result = updateImagePlacement([first, second], first.id, changed);

    expect(result[0].placement).toEqual(changed);
    expect(result[1].placement).toEqual(second.placement);
  });

  it('salva o enquadramento individual sem alterar as outras fotos', () => {
    const first = image('one', 0);
    const second = image('two', 1);
    const changed = { ...first.placement, x: 0.3, scale: 1.8 };

    const result = saveImagePlacement([first, second], first.id, changed);

    expect(result[0].savedPlacement).toEqual(changed);
    expect(result[1].savedPlacement).toEqual(second.savedPlacement);
  });

  it('marca apenas a fotografia aplicada', () => {
    const first = { ...image('one', 0), applied: false };
    const second = { ...image('two', 1), applied: false };

    const result = markImageApplied([first, second], second.id);

    expect(result[0].applied).toBe(false);
    expect(result[1].applied).toBe(true);
  });

  it('aplica patch isolado', () => {
    const first = image('one', 0);
    const second = image('two', 1);

    const result = patchImage([first, second], second.id, { name: 'nova.png' });

    expect(result[0].name).toBe('one.png');
    expect(result[1].name).toBe('nova.png');
  });
});
