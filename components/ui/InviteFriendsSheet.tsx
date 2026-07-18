'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Ticket } from 'lucide-react';
import Sheet from './Sheet';
import { useTripData } from '../TripDataProvider';
import { supabase } from '@/lib/supabase';

export default function InviteFriendsSheet({ onClose }: { onClose: () => void }) {
  const { activeTripId, trip } = useTripData();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadInvite = async () => {
      if (!supabase || !activeTripId) {
        if (active) {
          setError('Invitations are not available for this trip.');
          setLoading(false);
        }
        return;
      }
      const { data, error: inviteError } = await supabase
        .from('trip_invites')
        .select('code')
        .eq('trip_id', activeTripId)
        .eq('revoked', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (inviteError) setError(inviteError.message);
      else if (!data?.code) setError('This trip does not have an active invite yet.');
      else setCode(data.code as string);
      setLoading(false);
    };
    void loadInvite();
    return () => {
      active = false;
    };
  }, [activeTripId]);

  const inviteLink =
    code && typeof window !== 'undefined' ? `${window.location.origin}/join/${code}` : '';

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy the link. Please copy it manually.');
    }
  };

  return (
    <Sheet title="Invite friends" onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-muted">
          <Loader2 size={18} className="animate-spin" /> Loading invite…
        </div>
      ) : code ? (
        <>
          <div className="rounded-2xl border border-black/5 bg-cream-card p-4 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--city-accent)_14%,white)] text-[var(--city-accent)]">
              <Ticket size={19} />
            </span>
            <h3 className="mt-3 font-serif text-[20px] font-semibold text-ink">
              Invite friends to {trip.name}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Anyone with this link can sign in to Yarn and join the trip.
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">Invite code</p>
            <div className="rounded-xl border border-black/10 bg-cream-card px-4 py-3">
              <code className="text-[17px] font-semibold tracking-[0.08em] text-ink">
                {code}
              </code>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">Invite link</p>
            <div className="rounded-xl border border-black/10 bg-cream-card px-4 py-3">
              <p className="truncate text-[13px] text-muted">{inviteLink}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? 'Invite link copied' : ''}
          </span>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-[14px] text-muted">
          {error}
        </div>
      )}
    </Sheet>
  );
}
