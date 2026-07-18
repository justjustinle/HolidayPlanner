'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// OAuth landing page. The browser supabase client (flowType 'pkce',
// detectSessionInUrl) consumes the ?code=… from the redirect on init; we just
// wait for the session to materialise, then return to the app. Using a client
// page (not a server route) because the PKCE verifier lives in the browser.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      router.replace('/');
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/');
    };

    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get('error_description') ?? params.get('error');
    const tokenHash = params.get('token_hash');
    if (callbackError) {
      setError(callbackError);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });

    void (async () => {
      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });
        if (verifyError) {
          setError(verifyError.message);
          return;
        }
        go();
        return;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) setError(sessionError.message);
      else if (data.session) go();
    })();

    const t = window.setTimeout(() => {
      if (!done) setError('This sign-in link is invalid or has expired.');
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app items-center justify-center">
      {error ? (
        <div className="animate-fade-in px-6 text-center">
          <h1 className="font-serif text-[24px] font-semibold text-ink">Couldn&apos;t sign you in</h1>
          <p className="mt-2 text-sm text-saigon">{error}</p>
          <button
            type="button"
            onClick={() => router.replace('/')}
            className="mt-5 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="animate-fade-in text-sm text-muted">Signing you in…</div>
      )}
    </div>
  );
}
