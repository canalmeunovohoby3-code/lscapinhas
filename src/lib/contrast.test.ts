import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const pairs = [
  ['light body', '#2e3639', '#ffffff'],
  ['light muted', '#5f6b6e', '#ffffff'],
  ['light muted-light', '#626e71', '#f8f4ee'],
  ['light accent', '#a9491f', '#f8f4ee'],
  ['light button', '#ffffff', '#7e3c24'],
  ['dark body', '#f3eee7', '#101618'],
  ['dark card', '#f3eee7', '#1e2629'],
  ['dark muted', '#b9c2c3', '#1e2629'],
  ['dark muted-light', '#a2adaf', '#1e2629'],
  ['dark accent', '#f0a071', '#101618'],
  ['dark button', '#ffffff', '#a35a38'],
  ['dark footer', '#ffffff', '#0a1012'],
];

describe('contraste mínimo WCAG AA', () => {
  it.each(pairs)('%s atinge 4,5:1 para texto comum', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
