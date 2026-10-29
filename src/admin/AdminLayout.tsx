import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { MoonIcon, SunIcon } from '../components/Icons';
import { useAdminAuth } from './AdminAuth';
import { useAdminTheme } from './AdminTheme';

export function AdminLayout() {
  const { session, signOut } = useAdminAuth();
  const { theme, toggleTheme } = useAdminTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand" aria-label="LS Case — painel administrativo">
          <BrandLogo light eager />
          <span>Painel administrativo</span>
        </Link>

        <nav className="admin-nav" aria-label="Painel administrativo">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/pedidos"
            className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
          >
            Pedidos
          </NavLink>
          <NavLink
            to="/admin/catalogo"
            className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
          >
            Fotos do catálogo
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-user-email">{session?.user.email}</span>
          <button
            type="button"
            className="admin-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {theme === 'dark'
              ? <MoonIcon width={18} height={18} />
              : <SunIcon width={18} height={18} />}
          </button>
          <button type="button" className="admin-logout" onClick={handleLogout}>
            Sair
          </button>
          <Link to="/" className="admin-site-link">
            Ver site
          </Link>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <span>Painel administrativo · Gestão de pedidos</span>
          <button type="button" className="admin-logout admin-logout--topbar" onClick={handleLogout}>
            Sair
          </button>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
