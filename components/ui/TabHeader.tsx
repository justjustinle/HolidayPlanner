'use client';

import { useRef, useState } from 'react';
import { LogOut, Camera, Bell, BellRing, Loader2 } from 'lucide-react';
import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';
import { enablePush, pushPermission } from '@/lib/notifications/client';

// Shared header: optional eyebrow, serif title (with optional inline extras,
// e.g. flags), and the signed-in user's avatar (photo or initial). Tap it to
// change your photo or switch person.
export default function TabHeader({
  eyebrow,
  title,
  titleExtra,
  action,
}: {
  eyebrow?: string;
  title: string;
  titleExtra?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { me, signOut, setMyPhoto } = useTripData();
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState<'idle' | 'busy' | 'on' | 'error'>(
    () => (typeof window !== 'undefined' && pushPermission() === 'granted' ? 'on' : 'idle')
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const onEnablePush = async () => {
    if (!me || pushState === 'busy') return;
    setPushState('busy');
    const result = await enablePush(me.id);
    setPushState(result.ok ? 'on' : 'error');
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOpen(false);
    await setMyPhoto(file);
  };

  return (
    <header className="px-5 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="text-[12px] text-muted">{eyebrow}</div>}
          {/* One flex row so the title, extras (flags), and the avatar column
              all sit on the same line, vertically centered. The title
              truncates rather than wrapping if space ever runs out. */}
          <div className="mt-1 flex items-center gap-2">
            <h1 className="truncate font-serif text-[26px] font-semibold leading-tight text-ink">
              {title}
            </h1>
            {titleExtra && (
              <span className="flex flex-none items-center whitespace-nowrap">
                {titleExtra}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-none items-center gap-2.5">
          {action}
          {me && (
            <div className="relative">
              <button onClick={() => setOpen((o) => !o)} aria-label="Account">
                <Avatar name={me.name} src={me.avatar_url} size={38} />
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-black/5 bg-cream-card p-1 shadow-polaroid">
                    <div className="px-3 py-2 text-[13px] text-muted">
                      Signed in as <span className="font-medium text-ink">{me.name}</span>
                    </div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-black/5"
                    >
                      <Camera size={15} />{' '}
                      {me.avatar_url ? 'Change profile picture' : 'Add profile picture'}
                    </button>
                    <button
                      onClick={onEnablePush}
                      disabled={pushState === 'busy'}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-black/5"
                    >
                      {pushState === 'busy' ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : pushState === 'on' ? (
                        <BellRing size={15} />
                      ) : (
                        <Bell size={15} />
                      )}
                      {pushState === 'on'
                        ? 'Notifications on'
                        : pushState === 'error'
                          ? 'Notifications unavailable'
                          : 'Enable notifications'}
                    </button>
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-black/5"
                    >
                      <LogOut size={15} /> Switch person
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={onPick}
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
}
