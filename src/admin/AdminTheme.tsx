import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_THEME_STORAGE_KEY,
  nextAdminTheme,
  readAdminTheme,
  type AdminTheme,
} from './theme';

interface AdminThemeValue {
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeValue | null>(null);

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>(() => (
    typeof window === 'undefined' ? 'light' : readAdminTheme(window.localStorage)
  ));

  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
    } catch {
      // A preferência visual não é crítica para o funcionamento do painel.
    }
  }, [theme]);

  const value = useMemo<AdminThemeValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => nextAdminTheme(current)),
  }), [theme]);

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={`admin-theme${theme === 'dark' ? ' admin-theme--dark' : ''}`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeValue {
  const value = useContext(AdminThemeContext);
  if (!value) {
    throw new Error('useAdminTheme precisa ser usado dentro de AdminThemeProvider.');
  }
  return value;
}
