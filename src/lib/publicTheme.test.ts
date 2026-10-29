import { describe, expect, it } from 'vitest';
import {
  nextPublicTheme,
  normalizePublicTheme,
  resolveInitialPublicTheme,
} from './publicTheme';

describe('tema público', () => {
  it('alterna imediatamente entre claro e escuro', () => {
    expect(nextPublicTheme('light')).toBe('dark');
    expect(nextPublicTheme('dark')).toBe('light');
  });

  it('respeita a preferência salva antes da preferência do sistema', () => {
    expect(resolveInitialPublicTheme('dark', false)).toBe('dark');
    expect(resolveInitialPublicTheme('light', true)).toBe('light');
    expect(resolveInitialPublicTheme(null, true)).toBe('dark');
    expect(resolveInitialPublicTheme(null, false)).toBe('light');
  });

  it('ignora valores inválidos', () => {
    expect(normalizePublicTheme('sepia')).toBeNull();
    expect(normalizePublicTheme(null)).toBeNull();
  });
});
