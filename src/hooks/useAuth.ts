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
  is_authorized?: boolean;
  is_platform_superadmin?: boolean;
}

const DEFAULT_COMPANY_ID = 'a1111111-2222-3333-4444-555555555555';
const OWNER_EMAILS = [
  'ariel.mellag@gmail.com', 
  'fariacricardog@gmail.com', 
  'equipo@belean.cl'
];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeCompanyOverride, setActiveCompanyOverride] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nexus_air_owner_company_override');
    } catch {
      return null;
    }
  });
  const [cachedEffectiveCompany] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nexus_air_owner_company_override') ||
             localStorage.getItem('nexus_air_effective_company_id');
    } catch {
      return null;
    }
  });

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[useAuth] Profile fetch note:', error.message);
      }

      // Si no existe por UUID (ej. creado antes en profiles o por email), buscar por email
      const targetEmail = userEmail || user?.email;
      if (!data && targetEmail) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', targetEmail.trim())
          .maybeSingle();

        if (byEmail) {
          data = byEmail;
          // Auto-vincular el ID oficial de Auth para sesiones futuras
          try {
            await supabase.from('profiles').update({ id: userId, updated_at: new Date().toISOString() }).eq('email', targetEmail.trim());
          } catch (linkErr) {
            console.warn('[useAuth] Link profile UUID warning:', linkErr);
          }
        }
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback seguro: NUNCA asignar 'admin' a ciegas a usuarios que no son owners reconocidos
        const isKnownOwner = OWNER_EMAILS.includes(targetEmail?.toLowerCase() || '');
        const defaultFallbackRole = isKnownOwner ? 'admin' : (user?.user_metadata?.role || 'user');

        setProfile({
          id: userId,
          email: targetEmail || '',
          full_name: user?.user_metadata?.full_name || targetEmail?.split('@')[0] || 'Colaborador HVAC',
          role: defaultFallbackRole,
          company_id: user?.user_metadata?.company_id || DEFAULT_COMPANY_ID,
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
          await fetchProfile(session.user.id, session.user.email);
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
        await fetchProfile(session.user.id, session.user.email);
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
    setActiveCompanyOverride(null);
    localStorage.removeItem('nexus_air_owner_company_override');
    localStorage.removeItem('nexus_air_effective_company_id');
  };

  const switchActiveCompany = (companyId: string | null) => {
    if (companyId) {
      localStorage.setItem('nexus_air_owner_company_override', companyId);
      localStorage.setItem('nexus_air_effective_company_id', companyId);
      setActiveCompanyOverride(companyId);
    } else {
      localStorage.removeItem('nexus_air_owner_company_override');
      localStorage.removeItem('nexus_air_effective_company_id');
      setActiveCompanyOverride(null);
    }
  };

  const emailLower = user?.email?.trim().toLowerCase() || '';
  const profileEmailLower = profile?.email?.trim().toLowerCase() || '';
  const roleLower = profile?.role?.trim().toLowerCase() || '';

  const isNexusOwner = 
    OWNER_EMAILS.includes(emailLower) || 
    OWNER_EMAILS.includes(profileEmailLower) || 
    ['nexusowner', 'nexus_owner', 'owner', 'superadmin'].includes(roleLower) ||
    Boolean(profile?.is_platform_superadmin);

  const effectiveCompanyId = (isNexusOwner && activeCompanyOverride)
    ? activeCompanyOverride
    : (activeCompanyOverride || profile?.company_id || (loadingAuth ? cachedEffectiveCompany : null) || DEFAULT_COMPANY_ID);

  useEffect(() => {
    if (effectiveCompanyId && !loadingAuth) {
      try {
        localStorage.setItem('nexus_air_effective_company_id', effectiveCompanyId);
      } catch {}
    }
  }, [effectiveCompanyId, loadingAuth]);

  return {
    user,
    profile,
    loadingAuth,
    isNexusOwner,
    effectiveCompanyId,
    activeCompanyOverride,
    switchActiveCompany,
    login,
    logout
  };
}

