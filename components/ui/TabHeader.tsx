'use client';

import { useRef, useState } from 'react';
import { LogOut, Camera } from 'lucide-react';
import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';

// Shared header: eyebrow, serif title, and the signed-in user's avatar (photo
// or initial). Tap it to change your photo or switch person.
export default function TabHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const { me, signOut, setMyPhoto } = useTripData();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOpen(false);
    await setMyPhoto(file);
  };

  return (
    <header className="px-5 pt-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] text-muted">{eyebrow}</div>
          <h1 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-ink">
            {title}
          </h1>
        </div>

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
                    <Camera size={15} /> {me.avatar_url ? 'Change photo' : 'Add photo'}
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
    </header>
  );
}
