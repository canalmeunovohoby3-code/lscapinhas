import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  PUBLIC_THEME_STORAGE_KEY,
  nextPublicTheme,
  normalizePublicTheme,
  resolveInitialPublicTheme,
  type PublicTheme,
} from '../lib/publicTheme';

interface PublicThemeValue {
  theme: PublicTheme;
  toggleTheme: () => void;
}

const PublicThemeContext = createContext<PublicThemeValue | null>(null);

function readInitialTheme(): PublicTheme {
  if (typeof window === 'undefined') return 'light';

  const fromDocument = normalizePublicTheme(document.documentElement.dataset.theme);
  if (fromDocument) return fromDocument;

  try {
    return resolveInitialPublicTheme(
      window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY),
      window.matchMedia('(prefers-color-scheme: dark)').matches,
    );
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PublicTheme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
    } catch {
      // A preferência visual não bloqueia o funcionamento do site.
    }
  }, [theme]);

  const value = useMemo<PublicThemeValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => nextPublicTheme(current)),
  }), [theme]);

  return (
    <PublicThemeContext.Provider value={value}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme(): PublicThemeValue {
  const value = useContext(PublicThemeContext);
  if (!value) {
    throw new Error('usePublicTheme precisa ser usado dentro de ThemeProvider.');
  }
  return value;
}
