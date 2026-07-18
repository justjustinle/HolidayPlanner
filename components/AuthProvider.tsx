'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AUTH_ENABLED } from '@/lib/authConfig';

// The signed-in Google account (a row-agnostic identity), distinct from a trip
// membership (a `profiles` row). One account can be a member of many trips.
export interface Account {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthValue {
  authEnabled: boolean;
  authReady: boolean;
  session: Session | null;
  account: Account | null;
  signInWithGoogle: () => Promise<void>;
  signOutAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function toAccount(session: Session | null): Account | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: (meta.full_name as string) ?? (meta.name as string) ?? null,
    avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
  };
}

const active = AUTH_ENABLED && isSupabaseConfigured;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // When auth is off we are "ready" immediately with no session — the app then
  // falls back to the name-based Welcome Gate exactly as before.
  const [authReady, setAuthReady] = useState(!active);

  useEffect(() => {
    if (!active || !supabase) return;
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signOutAccount = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      authEnabled: active,
      authReady,
      session,
      account: toAccount(session),
      signInWithGoogle,
      signOutAccount,
    }),
    [authReady, session, signInWithGoogle, signOutAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
