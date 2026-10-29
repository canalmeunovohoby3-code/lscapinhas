import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const pairs = [
  ['admin light body', '#2e3639', '#ffffff'],
  ['admin light muted', '#5f6b6e', '#ffffff'],
  ['admin light muted-light', '#626e71', '#f8f4ee'],
  ['admin light accent', '#a9491f', '#f8f4ee'],
  ['admin light button', '#ffffff', '#7e3c24'],
  ['admin dark body', '#f1ece5', '#14191b'],
  ['admin dark card', '#f1ece5', '#1f2629'],
  ['admin dark muted', '#adb6b7', '#1f2629'],
  ['admin dark muted-light', '#a0abad', '#1f2629'],
  ['admin dark accent', '#f0a071', '#14191b'],
  ['admin dark button', '#ffffff', '#a35a38'],
];

describe('contraste mínimo WCAG AA no painel', () => {
  it.each(pairs)('%s atinge 4,5:1 para texto comum', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
