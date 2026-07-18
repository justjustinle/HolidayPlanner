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
  UserPlus,
  Map,
  Pencil,
} from 'lucide-react';
import Avatar from './Avatar';
import YarnLogo from '../brand/YarnLogo';
import { useTripData } from '../TripDataProvider';
import { useAuth } from '../AuthProvider';
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
  onOpenInvite,
  onOpenEditName,
}: {
  open: boolean;
  onClose: () => void;
  onOpenRoster: () => void;
  onOpenInvite: () => void;
  onOpenEditName: () => void;
}) {
  const { me, signOut, setMyPhoto, setActiveTrip } = useTripData();
  const { authEnabled, signOutAccount } = useAuth();
  const [pushState, setPushState] = useState<'idle' | 'busy' | 'on' | 'error'>(
    'idle'
  );
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
          {me && (
            <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3">
              <Avatar name={me.name} src={me.avatar_url} size={44} />
              <div className="min-w-0">
                <div className="text-[12px] text-muted">Signed in as</div>
                <div className="truncate text-[16px] font-medium text-ink">
                  {me.name}
                </div>
              </div>
            </div>
          )}

          {authEnabled && (
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveTrip(null);
              }}
              className={itemCls}
            >
              <Map size={18} className="text-muted" /> My trips
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenEditName();
            }}
            disabled={!me}
            className={itemCls}
          >
            <Pencil size={18} className="text-muted" /> Edit name
          </button>
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
          {authEnabled && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInvite();
              }}
              className={itemCls}
            >
              <UserPlus size={18} className="text-muted" /> Invite friends
            </button>
          )}
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
    </>
  );
}
