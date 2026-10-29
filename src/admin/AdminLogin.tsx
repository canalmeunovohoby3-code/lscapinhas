import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { ArrowRightIcon, ShieldIcon } from '../components/Icons';
import { usePageMeta } from '../lib/usePageMeta';
import { useAdminAuth } from './AdminAuth';
import { AdminAccessDenied, AdminLoading } from './AdminStates';

export function AdminLogin() {
  usePageMeta('Acesso administrativo | LS Case');
  const { session, isAdmin, loading, configured, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <AdminLoading />;
  if (session && isAdmin) return <Navigate to="/admin" replace />;
  if (session && !isAdmin) return <AdminAccessDenied />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Não foi possível entrar. Verifique os dados.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <BrandLogo light eager />
          <span>Painel administrativo</span>
        </div>

        <span className="admin-login-icon" aria-hidden="true">
          <ShieldIcon width={25} height={25} />
        </span>
        <h1>Acesso restrito</h1>
        <p className="admin-login-subtitle">
          Entre com a conta administrativa autorizada para gerenciar os pedidos.
        </p>

        {!configured && (
          <p className="admin-notice" role="status">
            Integração Supabase não configurada. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
          </p>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="field admin-field">
            <span className="field-label">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={submitting || !configured}
            />
          </label>

          <label className="field admin-field">
            <span className="field-label">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting || !configured}
            />
          </label>

          {error && (
            <p className="form-error admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-large"
            disabled={submitting || !configured}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
            {!submitting && <ArrowRightIcon width={17} height={17} />}
          </button>
        </form>

        <p className="admin-login-note">
          Não existe cadastro público de administrador. O acesso é concedido pelo responsável.
        </p>
        <Link to="/" className="admin-login-back">
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
