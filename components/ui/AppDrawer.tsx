'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  LogOut,
  Camera,
  BellOff,
  BellRing,
  Loader2,
  Users,
  Plus,
  Ticket,
} from 'lucide-react';
import Avatar from './Avatar';
import YarnLogo from '../brand/YarnLogo';
import { useTripData } from '../TripDataProvider';
import { useAuth } from '../AuthProvider';
import CreateTripSheet from '../trips/CreateTripSheet';
import { formatTripDate } from '@/lib/trip';
import {
  disablePush,
  enablePush,
  isPushEnabled,
} from '@/lib/notifications/client';

// Left account drawer (YouTube-style). Brand lockup + close in the header;
// profile actions moved here from the old avatar popover.
export default function AppDrawer({
  open,
  onClose,
  onOpenRoster,
}: {
  open: boolean;
  onClose: () => void;
  onOpenRoster: () => void;
}) {
  const { me, signOut, setMyPhoto, setActiveTrip, myTrips, activeTripId } = useTripData();
  const { authEnabled, account, signOutAccount } = useAuth();
  const [pushState, setPushState] = useState<'idle' | 'busy' | 'on' | 'error'>(
    'idle'
  );
  const [creatingTrip, setCreatingTrip] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const notificationsOn = pushState === 'on';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const enabled = await isPushEnabled();
      if (!cancelled) setPushState(enabled ? 'on' : 'idle');
    })();
    return () => {
      cancelled = true;
    };
  }, [open, me?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onTogglePush = async () => {
    if (!me || pushState === 'busy') return;
    const turningOff = pushState === 'on';
    setPushState('busy');
    const result = turningOff
      ? await disablePush(me.id)
      : await enablePush(me.id);
    if (result.ok) {
      setPushState(turningOff ? 'idle' : 'on');
    } else {
      const stillOn = await isPushEnabled();
      setPushState(stillOn ? 'on' : result.reason === 'denied' ? 'idle' : 'error');
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await setMyPhoto(file);
  };

  const itemCls =
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] text-ink hover:bg-black/5';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/35 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal
        aria-label="Account menu"
        className="animate-drawer-in fixed inset-y-0 left-0 z-50 flex w-[min(320px,88vw)] flex-col bg-cream-card shadow-polaroid"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2 text-[var(--city-accent)]">
            <YarnLogo size={28} color="currentColor" />
            <span className="font-serif text-[22px] font-semibold leading-none text-ink">
              Yarn
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {/* Identity: the Google account when auth is on, else the member. */}
          {authEnabled && account ? (
            <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3">
              <Avatar name={account.name ?? account.email ?? '?'} src={account.avatarUrl} size={44} />
              <div className="min-w-0">
                <div className="truncate text-[16px] font-medium text-ink">
                  {account.name ?? 'Signed in'}
                </div>
                {account.email && (
                  <div className="truncate text-[12px] text-muted">{account.email}</div>
                )}
              </div>
            </div>
          ) : (
            me && (
              <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3">
                <Avatar name={me.name} src={me.avatar_url} size={44} />
                <div className="min-w-0">
                  <div className="text-[12px] text-muted">Signed in as</div>
                  <div className="truncate text-[16px] font-medium text-ink">{me.name}</div>
                </div>
              </div>
            )
          )}

          {/* My trips section (auth on): switch trip, create, or join. */}
          {authEnabled && (
            <div className="mb-2 border-b border-black/5 pb-2">
              <div className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wide text-muted">
                My trips
              </div>
              {myTrips.map((t) => {
                const current = t.id === activeTripId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (!current) setActiveTrip(t.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-black/5 ${
                      current ? 'bg-black/[.04]' : ''
                    }`}
                  >
                    <span
                      className="h-8 w-1.5 flex-none rounded-full"
                      style={{ background: current ? 'var(--city-accent)' : 'rgba(0,0,0,.15)' }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-ink">
                        {t.name}
                      </span>
                      <span className="block truncate text-[12px] text-muted">
                        {formatTripDate(t.start_date).replace(/^\w+\s/, '')} –{' '}
                        {formatTripDate(t.end_date).replace(/^\w+\s/, '')}
                      </span>
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCreatingTrip(true)}
                className={itemCls}
              >
                <Plus size={18} className="text-muted" /> Create a trip
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTrip(null);
                }}
                className={itemCls}
              >
                <Ticket size={18} className="text-muted" /> Join with a code
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRoster();
            }}
            className={itemCls}
          >
            <Users size={18} className="text-muted" /> Who&apos;s going
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={itemCls}
          >
            <Camera size={18} className="text-muted" />{' '}
            {me?.avatar_url ? 'Change profile picture' : 'Add profile picture'}
          </button>
          <button
            type="button"
            onClick={onTogglePush}
            disabled={pushState === 'busy' || !me}
            aria-pressed={notificationsOn}
            className={itemCls}
          >
            {pushState === 'busy' ? (
              <Loader2 size={18} className="animate-spin text-muted" />
            ) : notificationsOn ? (
              <BellRing size={18} className="text-muted" />
            ) : (
              <BellOff size={18} className="text-muted" />
            )}
            {pushState === 'busy'
              ? 'Updating…'
              : pushState === 'error'
                ? 'Notifications failed — retry'
                : notificationsOn
                  ? 'Notifications on'
                  : 'Notifications off'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (authEnabled) void signOutAccount();
              else signOut();
            }}
            className={itemCls}
          >
            <LogOut size={18} className="text-muted" /> Log out
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={onPick}
          className="hidden"
        />
      </aside>

      {creatingTrip && (
        <CreateTripSheet
          onClose={() => {
            setCreatingTrip(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
