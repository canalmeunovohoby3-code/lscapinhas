import { describe, expect, it } from 'vitest';
import {
  buildExportFileName,
  clamp,
  getContainScale,
  getCoverScale,
  getCoverSourceRect,
  getReferenceInitialScale,
  getRotationCoverScale,
  nextRotation,
  normalizeRotation,
  validateCustomizerImages,
} from './imageUtils';

const jpeg = { name: 'foto.jpg', size: 1_000_000, type: 'image/jpeg' };
const png = { name: 'foto.png', size: 1_000_000, type: 'image/png' };

describe('personalizador 2D', () => {
  it('valida formatos, tamanho e quantidade de fotos', () => {
    expect(validateCustomizerImages([jpeg])).toBeNull();
    expect(validateCustomizerImages([{ ...jpeg, type: 'image/gif' }])).toContain('JPEG');
    expect(validateCustomizerImages([{ ...jpeg, size: 10 * 1024 * 1024 + 1 }])).toContain('10 MB');
    expect(validateCustomizerImages([jpeg], 1)).toContain('somente uma fotografia');
    expect(validateCustomizerImages([jpeg, png])).toContain('somente uma fotografia');
  });

  it('normaliza rotação em passos de 90 graus', () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(nextRotation(350, 'right')).toBe(80);
    expect(nextRotation(0, 'left')).toBe(270);
  });

  it('limita valores de zoom e calcula recorte cover', () => {
    expect(clamp(4, 0.5, 3)).toBe(3);
    expect(clamp(0.1, 0.5, 3)).toBe(0.5);
    expect(getCoverSourceRect(100, 100, 50, 100)).toEqual({
      sx: 25,
      sy: 0,
      sw: 50,
      sh: 100,
    });
  });

  it('calcula encaixe contain sem cortar a fotografia', () => {
    expect(getContainScale(600, 900, 253, 525)).toBeCloseTo(253 / 600);
    expect(getContainScale(900, 600, 253, 525)).toBeCloseTo(253 / 900);
    expect(getContainScale(600, 600, 253, 525)).toBeCloseTo(253 / 600);
    expect(getContainScale(0, 600, 253, 525)).toBe(1);
  });

  it('calcula encaixe cover para cobrir toda a área imprimível', () => {
    expect(getCoverScale(600, 900, 253, 525)).toBeCloseTo(525 / 900);
    expect(getCoverScale(900, 600, 253, 525)).toBeCloseTo(525 / 600);
    expect(getCoverScale(600, 600, 253, 525)).toBeCloseTo(525 / 600);
    expect(getCoverScale(0, 600, 253, 525)).toBe(1);
  });

  it('calcula o enquadramento inicial pela altura de referência de 558 px', () => {
    expect(getReferenceInitialScale(600, 800, 263, 536)).toBeCloseTo(558 / 536);
    expect(getReferenceInitialScale(600, 1200, 263, 536)).toBeCloseTo(558 / 536);
    expect(getReferenceInitialScale(300, 1200, 263, 536)).toBeCloseTo(
      558 / (1200 * (263 / 300)),
    );
    expect(getReferenceInitialScale(0, 800, 263, 536)).toBe(1);
  });

  it('compensa a rotação para a foto continuar cobrindo a capinha', () => {
    expect(getRotationCoverScale(0, 608, 1108)).toBe(1);
    expect(getRotationCoverScale(180, 608, 1108)).toBe(1);
    expect(getRotationCoverScale(90, 608, 1108)).toBeCloseTo(1108 / 608);
    expect(getRotationCoverScale(270, 608, 1108)).toBeCloseTo(1108 / 608);
    expect(getRotationCoverScale(90, 0, 1108)).toBe(1);
  });

  it('gera nome previsível para a prévia', () => {
    expect(buildExportFileName('iphone-16-pro-max'))
      .toBe('lscase-personalizador-iphone-16-pro-max.png');
  });
});
