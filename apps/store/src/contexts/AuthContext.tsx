import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecovery: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // No-op; just ensure we don't keep stale recovery state
        if (event === 'SIGNED_OUT') setIsRecovery(false);
      }
    });

    // Wrap getSession in try/catch — refresh-token errors should not crash the app.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // Stale/invalid refresh token — clear silently and continue as guest
          console.warn('[Auth] Stale session, signing out silently:', error.message);
          supabase.auth.signOut().catch(() => {
            /* ignore */
          });
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Auth] getSession threw:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) return { error: error.message };

    // Store phone in customers table (best-effort; row may be created by trigger)
    if (phone && data.user) {
      try {
        await supabase.from('customers').update({ phone }).eq('id', data.user.id);
      } catch (err) {
        console.warn('[Auth] Failed to persist phone on signup:', err);
      }
    }

    return { error: null };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Even if remote signOut fails, clear local state
      console.warn('[Auth] signOut error (non-fatal):', err);
    }
  };

  const isAuthenticated = !!session;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, session, loading, isRecovery, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
