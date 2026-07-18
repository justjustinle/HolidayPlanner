'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import Avatar from '../ui/Avatar';
import type { ClaimableMember } from '../TripDataProvider';

// Invite-code entry with the claim flow: after a valid code we ask "are you one
// of these people?" (the trip's unclaimed members, fetched via an RLS-safe RPC
// so a not-yet-member can see them) so history attaches to the right person;
// "No, I'm new" joins as a fresh member.
export default function JoinByCode({ onDone }: { onDone?: () => void }) {
  const { fetchClaimableMembers, claimMembership, joinTripByCode } = useTripData();
  const [code, setCode] = useState('');
  const [candidates, setCandidates] = useState<ClaimableMember[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const members = await fetchClaimableMembers(code);
      if (members.length > 0) {
        setCandidates(members);
      } else {
        // No unclaimed members → just join as new.
        await joinTripByCode(code);
        onDone?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  const claim = async (memberId: string) => {
    setBusy(true);
    setError(null);
    try {
      await claimMembership(memberId);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim that member.');
      setBusy(false);
    }
  };

  const joinAsNew = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinTripByCode(code);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join.');
      setBusy(false);
    }
  };

  if (candidates) {
    return (
      <div>
        <p className="mb-3 text-center text-[13px] text-muted">Are you one of these people?</p>
        <div className="flex flex-wrap justify-center gap-4">
          {candidates.map((m) => (
            <button
              key={m.id}
              onClick={() => claim(m.id)}
              disabled={busy}
              className="flex w-16 flex-col items-center gap-1.5 disabled:opacity-40"
            >
              <Avatar name={m.name} src={m.avatar_url} size={52} />
              <span className="max-w-full truncate text-[12px] text-ink">{m.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={joinAsNew}
          disabled={busy}
          className="mx-auto mt-4 flex items-center gap-2 rounded-xl border border-black/15 bg-cream-card px-4 py-2 text-[14px] font-medium text-ink disabled:opacity-40"
        >
          {busy && <Loader2 size={14} className="animate-spin" />} No, I&apos;m new
        </button>
        {error && <p className="mt-3 text-center text-[13px] text-saigon">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={lookUp}>
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
          disabled={!code.trim() || busy}
          className="flex flex-none items-center justify-center gap-2 rounded-xl border border-black/15 bg-cream-card px-4 text-[15px] font-medium text-ink disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-saigon">{error}</p>}
    </form>
  );
}
