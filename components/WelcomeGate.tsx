'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, LogOut } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import { useAuth } from './AuthProvider';
import { ThaiFlag, VietnamFlag } from './ui/Flag';
import PlaneJourney from './ui/PlaneJourney';
import Avatar from './ui/Avatar';
import JoinByCode from './trips/JoinByCode';

// Shared branded header for every gate variant (flags, plane, headline).
function GateHeader({ subtitle }: { subtitle: string }) {
  return (
    <>
      <div className="mb-5 flex items-center justify-center gap-3">
        <ThaiFlag size={34} />
        <span className="text-muted">·</span>
        <VietnamFlag size={34} />
      </div>
      <div className="mb-4">
        <PlaneJourney />
      </div>
      <h1 className="text-center text-[15px] font-semibold uppercase tracking-[0.15em] text-bangkok">
        Are you ready for the trip of a lifetime
      </h1>
      <p className="mt-3 text-center font-serif text-[30px] font-semibold leading-tight text-ink">
        Thailand &amp; Vietnam 2026
      </p>
      <p className="mt-3 text-center text-[15px] text-muted">{subtitle}</p>
    </>
  );
}

// Google "G" mark (inline SVG so it works under the artifact/self-contained CSP
// and needs no external asset).
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

// Variant A — sign in with Google (auth enabled, no account yet).
function GoogleGate() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center px-6 py-8">
      <div className="animate-fade-in">
        <GateHeader subtitle="Sign in to start planning." />
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            try {
              await signInWithGoogle();
            } catch {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-cream-card py-3.5 text-[15px] font-medium text-ink shadow-sm disabled:opacity-40"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleMark />}
          Continue with Google
        </button>
      </div>
    </div>
  );
}

// Variant B — signed in but no membership on the open trip: join / claim via an
// invite code (RLS-safe; a non-member can't read the roster directly).
function ClaimGate() {
  const { setActiveTrip } = useTripData();
  const { account, signOutAccount } = useAuth();

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center px-6 py-8">
      <div className="animate-fade-in">
        <GateHeader subtitle={`Signed in as ${account?.email ?? 'your account'}.`} />

        <div className="mt-8">
          <p className="mb-2 text-center text-[12px] uppercase tracking-wide text-muted">
            Enter your invite code to join
          </p>
          <JoinByCode />
        </div>

        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setActiveTrip(null)}
            className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
          >
            ← My trips
          </button>
          <button
            type="button"
            onClick={() => signOutAccount()}
            className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// Flow A: the login gate. Branches on the auth mode: Google sign-in and member
// claiming when auth is enabled, otherwise the original name-based flow (demo
// mode + the pre-auth build).
export default function WelcomeGate() {
  const { ensureProfile, signInAs, profiles, demoMode, needsMembership } = useTripData();
  const { authEnabled, account } = useAuth();

  if (authEnabled && !account) return <GoogleGate />;
  if (authEnabled && (needsMembership || !account)) return <ClaimGate />;

  return <NameGate ensureProfile={ensureProfile} signInAs={signInAs} profiles={profiles} demoMode={demoMode} />;
}

// The original name-typing gate, unchanged in behaviour.
function NameGate({
  ensureProfile,
  signInAs,
  profiles,
  demoMode,
}: {
  ensureProfile: ReturnType<typeof useTripData>['ensureProfile'];
  signInAs: ReturnType<typeof useTripData>['signInAs'];
  profiles: ReturnType<typeof useTripData>['profiles'];
  demoMode: boolean;
}) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await ensureProfile(name, photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center px-6 py-8">
      <div className="animate-fade-in">
        <GateHeader subtitle="Enter your name and let's get planning." />

        <form onSubmit={submit} className="mt-7">
          <div className="mb-5 flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-black/20 bg-cream-card text-muted"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <Camera size={24} />
                  <span className="text-[11px]">Add photo</span>
                </span>
              )}
            </button>
            <span className="mt-2 text-[12px] text-muted">
              {preview ? 'Tap to retake' : 'Optional — snap a selfie'}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={onPick}
              className="hidden"
            />
          </div>

          <input
            aria-label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-center text-[16px] text-ink outline-none focus:border-bangkok"
          />

          {error && <p className="mt-2 text-center text-sm text-saigon">{error}</p>}

          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Join the trip
          </button>
        </form>

        {profiles.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-center text-[12px] uppercase tracking-wide text-muted">
              Already on the trip? Tap your face
            </p>
            <div className="no-scrollbar flex flex-wrap justify-center gap-4">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => signInAs(p)}
                  className="flex w-16 flex-col items-center gap-1.5"
                >
                  <Avatar name={p.name} src={p.avatar_url} size={52} />
                  <span className="max-w-full truncate text-[12px] text-ink">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {demoMode && <p className="mt-6 text-center text-xs text-muted">Demo mode</p>}
      </div>
    </div>
  );
}
