export type PublicTheme = 'light' | 'dark';

export const PUBLIC_THEME_STORAGE_KEY = 'lscase:public-theme';

export function normalizePublicTheme(value: string | null | undefined): PublicTheme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function resolveInitialPublicTheme(
  saved: string | null | undefined,
  prefersDark: boolean,
): PublicTheme {
  return normalizePublicTheme(saved) ?? (prefersDark ? 'dark' : 'light');
}

export function nextPublicTheme(theme: PublicTheme): PublicTheme {
  return theme === 'dark' ? 'light' : 'dark';
}
