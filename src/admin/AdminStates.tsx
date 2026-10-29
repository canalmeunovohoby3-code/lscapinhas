import { Link, useNavigate } from 'react-router-dom';
import { ShieldIcon } from '../components/Icons';
import { useAdminAuth } from './AdminAuth';

export function AdminLoading() {
  return (
    <div className="admin-loading">
      <span className="admin-loading-spinner" aria-hidden="true" />
      <p>Carregando painel...</p>
    </div>
  );
}

export function AdminAccessDenied() {
  const { session, signOut } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card admin-denied">
        <span className="admin-denied-icon" aria-hidden="true">
          <ShieldIcon width={26} height={26} />
        </span>
        <h1>Acesso restrito</h1>
        <p>
          A conta {session?.user.email ? <strong>{session.user.email}</strong> : 'autenticada'} não
          está autorizada como administradora da LS Case.
        </p>
        <p className="admin-login-note">
          Solicite ao responsável a inclusão do seu usuário na lista administrativa.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={handleLogout}>
          Sair e entrar com outra conta
        </button>
        <Link to="/" className="admin-login-back">
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
