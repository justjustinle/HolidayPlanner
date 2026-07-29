'use client';

import { useEffect, useState } from 'react';
import { Plus, LogOut, Loader2, Ticket, X } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import { useAuth } from '../AuthProvider';
import { rangeLabelFromDays, formatTripDate, type TripDay } from '@/lib/trip';
import { readTripDraft, writeTripDraft } from '@/lib/createDrafts';
import CreateTripSheet from './CreateTripSheet';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { Trip } from '@/lib/types';

// Compact date range for a trip card, derived from its start/end dates.
function tripRange(trip: Trip): string {
  const days: TripDay[] = [
    { dayNumber: 1, destination: '', label: '', dateLabel: formatTripDate(trip.start_date), accentHex: '' },
    { dayNumber: 2, destination: '', label: '', dateLabel: formatTripDate(trip.end_date), accentHex: '' },
  ];
  return rangeLabelFromDays(days);
}

// Auth-on landing when no trip is open: pick an existing trip, create one, or
// join by invite code.
export default function MyTripsScreen() {
  const { myTrips, setActiveTrip, joinTripByCode, leaveTrip } = useTripData();
  const { account, signOutAccount } = useAuth();
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<Trip | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      if (readTripDraft()?.open) setCreating(true);
    };
    sync();
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', sync);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', sync);
    };
  }, []);

  const openCreate = () => {
    const existing = readTripDraft();
    if (existing && !existing.open) {
      writeTripDraft({ ...existing, open: true });
    }
    setCreating(true);
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || joining) return;
    setJoining(true);
    setError(null);
    try {
      await joinTripByCode(code);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code did not work.');
    } finally {
      setJoining(false);
    }
  };

  const confirmLeave = async () => {
    const trip = leaving;
    if (!trip || leavingId) return;
    setLeaving(null);
    setLeavingId(trip.id);
    setLeaveError(null);
    try {
      await leaveTrip(trip.id);
    } catch (caught) {
      setLeaveError(caught instanceof Error ? caught.message : 'Could not leave the trip.');
    } finally {
      setLeavingId(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-semibold text-ink">Your trips</h1>
          {account?.email && (
            <p className="text-[13px] text-muted">{account.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => signOutAccount()}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
        >
          <LogOut size={18} />
        </button>
      </header>

      {myTrips.length > 0 ? (
        <ul className="space-y-3">
          {myTrips.map((t) => (
            <li key={t.id}>
              <div className="flex w-full items-center rounded-2xl border border-black/10 bg-cream-card hover:border-black/20">
                <button
                  type="button"
                  onClick={() => setActiveTrip(t.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
                >
                  <span
                    className="h-10 w-1.5 flex-none rounded-full"
                    style={{ background: 'var(--city-accent, #c9992e)' }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-[18px] font-semibold text-ink">
                      {t.name}
                    </span>
                    <span className="block text-[13px] text-muted">{tripRange(t)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeaving(t)}
                  disabled={leavingId !== null}
                  aria-label={`Leave ${t.name}`}
                  className="mr-3 flex h-10 w-10 flex-none items-center justify-center rounded-full text-muted hover:bg-saigon/10 hover:text-saigon disabled:opacity-40"
                >
                  {leavingId === t.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <X size={18} />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-[14px] text-muted">
          No trips yet. Create one, or join with an invite code.
        </div>
      )}
      {leaveError && (
        <p className="mt-3 text-center text-[13px] text-saigon" role="alert">
          {leaveError}
        </p>
      )}

      <button
        type="button"
        onClick={openCreate}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white"
      >
        <Plus size={18} /> Create a trip
      </button>

      <form onSubmit={join} className="mt-8">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-muted">
          <Ticket size={14} /> Join with a code
        </p>
        <div className="flex gap-2">
          <input
            aria-label="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite code"
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={!code.trim() || joining}
            className="flex flex-none items-center justify-center gap-2 rounded-xl border border-black/15 bg-cream-card px-4 text-[15px] font-medium text-ink disabled:opacity-40"
          >
            {joining ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-saigon">{error}</p>}
      </form>

      {creating && <CreateTripSheet onClose={() => setCreating(false)} />}
      {leaving && (
        <ConfirmDialog
          title="Are you sure you want to leave the trip?"
          message={`You will need a new invite to rejoin ${leaving.name}.`}
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={confirmLeave}
          onCancel={() => setLeaving(null)}
        />
      )}
    </div>
  );
}
