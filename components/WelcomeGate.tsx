'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, LogOut } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import { useAuth } from './AuthProvider';
import { ThaiFlag, VietnamFlag } from './ui/Flag';
import PlaneJourney from './ui/PlaneJourney';
import Avatar from './ui/Avatar';
import AuthChoices from './auth/AuthChoices';

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

// Variant A — sign in with Google (auth enabled, no account yet).
function GoogleGate() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center px-6 py-8">
      <div className="animate-fade-in">
        <GateHeader subtitle="Sign in or create an account to start planning." />
        <AuthChoices />
      </div>
    </div>
  );
}

// Variant B — signed in but no membership yet: claim an existing member or join
// by code.
function ClaimGate() {
  const { profiles, claimMembership, joinTripByCode, setActiveTrip } = useTripData();
  const { account, signOutAccount } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const unclaimed = profiles.filter((p) => !p.user_id);

  const claim = async (memberId: string) => {
    setError(null);
    setBusyId(memberId);
    try {
      await claimMembership(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim that member.');
      setBusyId(null);
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusyId('__join__');
    try {
      await joinTripByCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code did not work.');
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center px-6 py-8">
      <div className="animate-fade-in">
        <GateHeader subtitle={`Signed in as ${account?.email ?? 'your account'}.`} />

        {unclaimed.length > 0 && (
          <div className="mt-7">
            <p className="mb-3 text-center text-[12px] uppercase tracking-wide text-muted">
              Which one are you? Tap your name
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {unclaimed.map((p) => (
                <button
                  key={p.id}
                  onClick={() => claim(p.id)}
                  disabled={busyId !== null}
                  className="flex w-16 flex-col items-center gap-1.5 disabled:opacity-40"
                >
                  <div className="relative">
                    <Avatar name={p.name} src={p.avatar_url} size={52} />
                    {busyId === p.id && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-cream/70">
                        <Loader2 size={18} className="animate-spin" />
                      </span>
                    )}
                  </div>
                  <span className="max-w-full truncate text-[12px] text-ink">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={join} className="mt-8">
          <p className="mb-2 text-center text-[12px] uppercase tracking-wide text-muted">
            Or join with a code
          </p>
          <input
            aria-label="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite code"
            className="w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-center text-[16px] text-ink outline-none focus:border-bangkok"
          />
          <button
            type="submit"
            disabled={busyId !== null || !code.trim()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {busyId === '__join__' && <Loader2 size={16} className="animate-spin" />}
            Join the trip
          </button>
        </form>

        {error && <p className="mt-3 text-center text-sm text-saigon">{error}</p>}

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
