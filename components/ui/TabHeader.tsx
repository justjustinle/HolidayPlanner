'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';

// Shared sticky-ish header: an eyebrow line, a serif title, and the signed-in
// user's avatar (tap to sign out / switch person).
export default function TabHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const { me, signOut } = useTripData();
  const [open, setOpen] = useState(false);

  return (
    <header className="px-5 pt-8">
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
              <Avatar name={me.name} size={38} />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-black/5 bg-cream-card p-1 shadow-polaroid">
                  <div className="px-3 py-2 text-[13px] text-muted">
                    Signed in as <span className="font-medium text-ink">{me.name}</span>
                  </div>
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
      </div>
    </header>
  );
}
