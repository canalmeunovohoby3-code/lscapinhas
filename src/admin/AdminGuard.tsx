import { Navigate } from 'react-router-dom';
import { resolveAdminAccess } from './access';
import { useAdminAuth } from './AdminAuth';
import { AdminLayout } from './AdminLayout';
import { AdminAccessDenied, AdminLoading } from './AdminStates';

export function AdminGuard() {
  const { session, isAdmin, loading } = useAdminAuth();
  const access = resolveAdminAccess({
    loading,
    hasSession: Boolean(session),
    isAdmin,
  });

  if (access === 'loading') return <AdminLoading />;
  if (access === 'login') return <Navigate to="/admin/login" replace />;
  if (access === 'denied') return <AdminAccessDenied />;

  return <AdminLayout />;
}
