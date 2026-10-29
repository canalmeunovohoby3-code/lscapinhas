export type AdminTheme = 'light' | 'dark';

export const ADMIN_THEME_STORAGE_KEY = 'lscase:admin-theme';

export function nextAdminTheme(theme: AdminTheme): AdminTheme {
  return theme === 'dark' ? 'light' : 'dark';
}

export function readAdminTheme(
  storage?: Pick<Storage, 'getItem'> | null,
): AdminTheme {
  try {
    return storage?.getItem(ADMIN_THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
