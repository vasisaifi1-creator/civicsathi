import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  // The row can be missing for accounts created before the signup trigger was in
  // place (or whose profile insert failed). Heal it through a SECURITY DEFINER RPC
  // that only ever acts on the caller's own auth.uid().
  const { data: healed, error: healError } = await supabase.rpc('ensure_profile', { p_user_id: userId });
  if (healError) throw healError;
  return healed;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  // 1. Restore the session and keep it in sync.
  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data?.session ?? null);
        setSessionReady(true);
      })
      .catch(() => {
        if (active) setSessionReady(true);
      });

    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  // 2. Load the profile (role, name) whenever the signed-in user changes.
  useEffect(() => {
    if (!sessionReady) return undefined;
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      setProfileReady(true);
      return undefined;
    }

    let active = true;
    setProfileReady(false);
    fetchProfile(userId)
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setProfileError(p ? null : new Error('PROFILE_MISSING'));
      })
      .catch((e) => {
        if (!active) return;
        setProfile(null);
        setProfileError(e);
      })
      .finally(() => {
        if (active) setProfileReady(true);
      });

    return () => {
      active = false;
    };
  }, [sessionReady, userId]);

  const signUp = useCallback(async ({ fullName, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Only the display name is sent. The database trigger always assigns role = 'citizen'.
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    const p = await fetchProfile(data.user.id);
    setProfile(p);
    setProfileError(p ? null : new Error('PROFILE_MISSING'));
    return p;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async ({ fullName, phoneNumber }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone_number: phoneNumber.trim() || null })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      isAdmin: profile?.role === 'admin',
      loading: !sessionReady || !profileReady,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [session, profile, profileError, sessionReady, profileReady, signUp, signIn, signOut, sendPasswordReset, updatePassword, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
