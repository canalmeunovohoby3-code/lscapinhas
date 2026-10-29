import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuth';

export function AdminLayout() {
  const { session, signOut } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          <strong>LS CASE</strong>
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
          <span>LS Case · Gestão de pedidos</span>
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
