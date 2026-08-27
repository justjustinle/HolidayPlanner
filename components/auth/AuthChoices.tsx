'use client';

import { useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../AuthProvider';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/** Map opaque Supabase/Resend failures to something readable on the sign-in screen. */
function friendlyAuthError(caught: unknown, fallback: string): string {
  const raw =
    caught instanceof Error
      ? caught.message
      : typeof caught === 'string'
        ? caught
        : '';
  const message = raw.trim();
  if (!message) return fallback;
  const lower = message.toLowerCase();
  if (
    lower.includes('error sending confirmation email') ||
    lower.includes('error sending magic link') ||
    lower.includes('error sending email')
  ) {
    return 'Could not send the sign-in email. Check that Resend SMTP uses a verified sender domain (not gmail.com).';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many sign-in emails just now. Wait a minute and try again.';
  }
  return message;
}

export default function AuthChoices({
  nextPath,
  googleLabel = 'Continue with Google',
}: {
  nextPath?: string;
  googleLabel?: string;
}) {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const google = async () => {
    setBusy('google');
    setError(null);
    try {
      await signInWithGoogle(nextPath);
    } catch (caught) {
      setError(friendlyAuthError(caught, 'Google sign-in could not start.'));
      setBusy(null);
    }
  };

  const emailLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address || busy) return;
    setBusy('email');
    setError(null);
    try {
      await signInWithEmail(address, nextPath);
      setSentTo(address);
    } catch (caught) {
      setError(friendlyAuthError(caught, 'Could not send the sign-in email.'));
    } finally {
      setBusy(null);
    }
  };

  if (sentTo) {
    return (
      <div className="mt-6 rounded-2xl border border-nhatrang/25 bg-nhatrang/[.08] p-4 text-center">
        <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-nhatrang/15 text-nhatrang">
          <Check size={18} />
        </span>
        <p className="mt-3 font-medium text-ink">Check your email</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          We sent a one-time sign-in link to <strong className="font-medium text-ink">{sentTo}</strong>.
        </p>
        <p className="mt-2 text-[12px] text-muted">You can close this tab after opening the link.</p>
        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setError(null);
          }}
          className="mt-3 text-[13px] font-medium text-ink underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="mt-7">
      <button
        type="button"
        onClick={google}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-cream-card py-3.5 text-[15px] font-medium text-ink shadow-sm disabled:opacity-40"
      >
        {busy === 'google' ? <Loader2 size={18} className="animate-spin" /> : <GoogleMark />}
        {googleLabel}
      </button>

      <div className="my-4 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-[11px] uppercase tracking-wider text-muted">or</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <form onSubmit={emailLink}>
        <label htmlFor="magic-link-email" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Email address
        </label>
        <div className="flex gap-2">
          <input
            id="magic-link-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[16px] text-ink outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={busy !== null || !email.trim()}
            className="flex flex-none items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[14px] font-medium text-white disabled:opacity-40"
          >
            {busy === 'email' ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
            Email link
          </button>
        </div>
      </form>

      <p className="mt-2 text-center text-[12px] leading-relaxed text-muted">
        Accessing via Browser? Tap the Share button and select &apos;Add to Home Screen&apos; to
        install Yarn!
      </p>
      {error && (
        <p className="mt-3 text-center text-[13px] text-saigon" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
