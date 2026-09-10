import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  company_id?: string;
  is_active?: boolean;
}

const DEFAULT_COMPANY_ID = 'a1111111-2222-3333-4444-555555555555';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[useAuth] Profile fetch note:', error.message);
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Si no existe perfil en la tabla, asignar fallback vinculado a la empresa principal
        setProfile({
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Administrador',
          role: 'admin',
          company_id: DEFAULT_COMPANY_ID,
          is_active: true
        });
      }
    } catch (err) {
      console.warn('[useAuth] Error in fetchProfile:', err);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[useAuth] Session check:', error.message);
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setLoadingAuth(false);
        }
      } catch (err) {
        console.error('[useAuth] Init session error:', err);
        setLoadingAuth(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass
    });
    return { data, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const effectiveCompanyId = profile?.company_id || DEFAULT_COMPANY_ID;

  return {
    user,
    profile,
    loadingAuth,
    effectiveCompanyId,
    login,
    logout
  };
}
