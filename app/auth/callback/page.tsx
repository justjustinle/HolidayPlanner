'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// OAuth landing page. The browser supabase client (flowType 'pkce',
// detectSessionInUrl) consumes the ?code=… from the redirect on init; we just
// wait for the session to materialise, then return to the app. Using a client
// page (not a server route) because the PKCE verifier lives in the browser.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      router.replace('/');
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace('/');
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    // Fallback so we never strand the user on this screen.
    const t = setTimeout(go, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app items-center justify-center">
      <div className="animate-fade-in text-sm text-muted">Signing you in…</div>
    </div>
  );
}
