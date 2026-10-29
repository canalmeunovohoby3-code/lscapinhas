export type AdminAccessState = 'loading' | 'login' | 'denied' | 'allowed';

export function resolveAdminAccess({
  loading,
  hasSession,
  isAdmin,
}: {
  loading: boolean;
  hasSession: boolean;
  isAdmin: boolean;
}): AdminAccessState {
  if (loading) return 'loading';
  if (!hasSession) return 'login';
  if (isAdmin) return 'allowed';
  return 'denied';
}
