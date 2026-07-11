'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import { ThaiFlag, VietnamFlag } from './ui/Flag';
import PlaneJourney from './ui/PlaneJourney';
import Avatar from './ui/Avatar';

// Flow A: the login gate. New copy, flags, a plane animation, an optional
// profile photo, and a tap-to-sign-in row of people already on the trip.
export default function WelcomeGate() {
  const { ensureProfile, signInAs, profiles, demoMode } = useTripData();
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
        {/* flags */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <ThaiFlag size={34} />
          <span className="text-muted">·</span>
          <VietnamFlag size={34} />
        </div>

        {/* plane journey */}
        <div className="mb-4">
          <PlaneJourney />
        </div>

        {/* copy */}
        <h1 className="text-center text-[15px] font-semibold uppercase tracking-[0.15em] text-bangkok">
          Are you ready for the trip of a lifetime
        </h1>
        <p className="mt-3 text-center font-serif text-[30px] font-semibold leading-tight text-ink">
          Thailand &amp; Vietnam 2026
        </p>
        <p className="mt-3 text-center text-[15px] text-muted">
          Enter your name and let&apos;s get planning.
        </p>

        <form onSubmit={submit} className="mt-7">
          {/* profile photo */}
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

        {/* already-provisioned users */}
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

        {demoMode && (
          <p className="mt-6 text-center text-xs text-muted">Demo mode</p>
        )}
      </div>
    </div>
  );
}
