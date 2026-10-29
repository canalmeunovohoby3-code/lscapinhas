import { usePublicTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon } from './Icons';

export function ThemeToggle() {
  const { theme, toggleTheme } = usePublicTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {isDark ? <MoonIcon width={20} height={20} /> : <SunIcon width={20} height={20} />}
    </button>
  );
}
