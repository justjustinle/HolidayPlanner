'use client';

import { useState } from 'react';
import { Plane, Loader2 } from 'lucide-react';
import { useTripData } from './TripDataProvider';

// Flow A: the one-time login gate. Shown when there is no cached profile
// (new user or a device whose cache was cleared). Submitting matches an
// existing name (case-insensitive) or creates a fresh profile.
export default function WelcomeGate() {
  const { ensureProfile, demoMode } = useTripData();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await ensureProfile(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center px-7">
      <div className="animate-fade-in">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-bangkok/15 text-bangkok">
          <Plane size={30} />
        </div>

        <h1 className="font-serif text-[30px] font-semibold leading-tight text-ink">
          Vietnam &amp; Thailand
          <br />
          Trip Planner
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Welcome! Enter your name to join the trip. We&apos;ll remember you on
          this device — pop your name in again on a new phone to pick up right
          where you left off.
        </p>

        <form onSubmit={submit} className="mt-8">
          <label htmlFor="name" className="mb-2 block text-xs uppercase tracking-wide text-muted">
            Your name
          </label>
          <input
            id="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[16px] text-ink outline-none focus:border-bangkok"
          />

          {error && <p className="mt-2 text-sm text-saigon">{error}</p>}

          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Join the trip
          </button>
        </form>

        {demoMode && (
          <p className="mt-6 text-center text-xs text-muted">
            Demo mode · try <span className="font-medium text-ink">Alex</span>,{' '}
            <span className="font-medium text-ink">Sam</span>,{' '}
            <span className="font-medium text-ink">Jo</span>,{' '}
            <span className="font-medium text-ink">Priya</span> or{' '}
            <span className="font-medium text-ink">Tom</span>
          </p>
        )}
      </div>
    </div>
  );
}
