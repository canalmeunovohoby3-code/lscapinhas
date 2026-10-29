import { describe, expect, it } from 'vitest';
import {
  ADMIN_THEME_STORAGE_KEY,
  nextAdminTheme,
  readAdminTheme,
} from './theme';

describe('tema administrativo', () => {
  it('alterna entre claro e escuro', () => {
    expect(nextAdminTheme('light')).toBe('dark');
    expect(nextAdminTheme('dark')).toBe('light');
  });

  it('lê a preferência salva e usa claro como fallback', () => {
    expect(readAdminTheme({
      getItem: (key) => (key === ADMIN_THEME_STORAGE_KEY ? 'dark' : null),
    })).toBe('dark');
    expect(readAdminTheme({ getItem: () => null })).toBe('light');
    expect(readAdminTheme(null)).toBe('light');
  });
});
