import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AdminAuthValue {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdmin = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;

    const { data, error: rpcError } = await supabase.rpc('is_admin');

    if (rpcError) throw rpcError;

    const admin = data === true;
    setIsAdmin(admin);
    return admin;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function initialize() {
      try {
        const { data, error: sessionError } = await supabase!.auth.getSession();

        if (!active) return;

        if (sessionError) {
          setError(sessionError.message);
          setIsAdmin(false);
          return;
        }

        setSession(data.session);

        if (data.session) {
          await checkAdmin();
        } else {
          setIsAdmin(false);
        }
      } catch {
        if (active) {
          setError('Não foi possível validar a sessão administrativa.');
          setIsAdmin(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      window.setTimeout(() => {
        if (!active) return;
        void checkAdmin()
          .catch(() => {
            if (active) setIsAdmin(false);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    }

    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) throw loginError;

    setSession(data.session);

    const admin = await checkAdmin();

    if (!admin) {
      await supabase.auth.signOut();
      setSession(null);
      setIsAdmin(false);
      throw new Error('Esta conta não possui permissão administrativa.');
    }
  }, [checkAdmin]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await checkAdmin();
    } catch {
      setError('Não foi possível validar a sessão administrativa.');
    }
  }, [checkAdmin]);

  const value = useMemo<AdminAuthValue>(() => ({
    session,
    isAdmin,
    loading,
    error,
    configured: isSupabaseConfigured,
    signIn,
    signOut,
    refresh,
  }), [error, isAdmin, loading, refresh, session, signIn, signOut]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) {
    throw new Error('useAdminAuth precisa ser usado dentro de AdminAuthProvider.');
  }
  return value;
}
