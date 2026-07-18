'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthProvider, { useAuth } from '@/components/AuthProvider';
import TripDataProvider, { useTripData } from '@/components/TripDataProvider';
import YarnLogo from '@/components/brand/YarnLogo';
import AuthChoices from '@/components/auth/AuthChoices';
import { supabase } from '@/lib/supabase';
import type { InvitePreview } from '@/lib/types';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function InviteLanding({ code }: { code: string }) {
  const router = useRouter();
  const { account, authEnabled, authReady } = useAuth();
  const { joinTripByCode } = useTripData();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    let active = true;
    const resolve = async () => {
      if (!supabase || !code) {
        if (active) {
          setError('This invitation is not available.');
          setLoading(false);
        }
        return;
      }
      const { data, error: resolveError } = await supabase.rpc('resolve_trip_invite', {
        invite_code: code,
      });
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : null;
      if (resolveError || !row) {
        setError('This invite link is invalid or has expired.');
      } else {
        setPreview(row as InvitePreview);
      }
      setLoading(false);
    };
    void resolve();
    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => {
    if (!authReady || !account || !preview || attempted.current) return;
    attempted.current = true;
    setJoining(true);
    setError(null);
    void joinTripByCode(code)
      .then(() => router.replace('/'))
      .catch((caught) => {
        attempted.current = false;
        setJoining(false);
        setError(caught instanceof Error ? caught.message : 'Could not join this trip.');
      });
  }, [account, authReady, code, joinTripByCode, preview, router]);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-app flex-col bg-cream px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-center">
        <YarnLogo size={46} color="currentColor" />
      </div>

      <div className="flex flex-1 flex-col justify-center py-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[14px] text-muted">
            <Loader2 size={18} className="animate-spin" /> Opening your invitation…
          </div>
        ) : preview ? (
          <div className="animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--city-accent)_14%,white)] text-[var(--city-accent)]">
              <Check size={24} />
            </div>
            <p className="mt-5 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--city-accent)]">
              You&apos;ve been invited
            </p>
            <h1 className="mt-2 text-center font-serif text-[32px] font-semibold leading-tight text-ink">
              {preview.trip_name}
            </h1>

            <div className="mt-6 rounded-2xl border border-black/10 bg-cream-card p-4">
              <p className="flex items-center gap-3 text-[14px] text-ink">
                <CalendarDays size={18} className="text-muted" />
                {formatDate(preview.start_date)} – {formatDate(preview.end_date)}
              </p>
              <p className="mt-3 flex items-center gap-3 text-[14px] text-ink">
                <Users size={18} className="text-muted" />
                {preview.member_count} traveler{preview.member_count === 1 ? '' : 's'} already joined
              </p>
            </div>

            <p className="mt-5 text-center text-[14px] leading-relaxed text-muted">
              Sign in to Yarn to join the group and view the holiday itinerary.
            </p>

            {!authEnabled ? (
              <p className="mt-5 rounded-xl bg-saigon/10 p-3 text-center text-[13px] text-saigon">
                Invitations are not enabled for this deployment.
              </p>
            ) : joining || (authReady && account) ? (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white">
                <Loader2 size={18} className="animate-spin" /> Joining trip…
              </div>
            ) : (
              <AuthChoices
                nextPath={`/join/${encodeURIComponent(code)}`}
                googleLabel="Sign in with Google to join"
              />
            )}
          </div>
        ) : (
          <div className="animate-fade-in text-center">
            <h1 className="font-serif text-[28px] font-semibold text-ink">
              Invitation unavailable
            </h1>
            <p className="mt-3 text-[14px] text-muted">{error}</p>
            <button
              type="button"
              onClick={() => router.replace('/')}
              className="mt-6 rounded-xl bg-ink px-6 py-3 text-[14px] font-medium text-white"
            >
              Go to Yarn
            </button>
          </div>
        )}

        {preview && error && (
          <p className="mt-4 text-center text-[13px] text-saigon" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

export default function JoinPage({ params }: { params: { code: string } }) {
  return (
    <AuthProvider>
      <TripDataProvider>
        <InviteLanding code={decodeURIComponent(params.code)} />
      </TripDataProvider>
    </AuthProvider>
  );
}
