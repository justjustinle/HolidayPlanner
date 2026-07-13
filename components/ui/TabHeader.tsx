'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import AppDrawer from './AppDrawer';
import TravelerFacepile from './TravelerFacepile';
import WhoIsGoingSheet from './WhoIsGoingSheet';
import { ThaiFlag, VietnamFlag } from './Flag';
import { TRIP_TITLE, tripDateRangeLabel } from '@/lib/trip';

// Shared trip identity header on every tab: hamburger → left drawer, trip
// title with inline flags, date meta, and overlapping traveler facepile.
export default function TabHeader({ action }: { action?: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const dates = tripDateRangeLabel();

  return (
    <header className="px-5 pt-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full text-ink hover:bg-black/5"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="flex min-w-0 items-center gap-2 font-serif text-[26px] font-semibold leading-tight text-ink">
            <span className="min-w-0 truncate">{TRIP_TITLE}</span>
            <span
              className="inline-flex shrink-0 items-center gap-1"
              aria-label="Thailand and Vietnam"
            >
              <ThaiFlag size={20} />
              <VietnamFlag size={20} />
            </span>
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-muted">{dates}</p>
          <div className="mt-2.5 flex items-center gap-3">
            <TravelerFacepile onOpen={() => setRosterOpen(true)} size={26} />
            {action}
          </div>
        </div>
      </div>

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenRoster={() => setRosterOpen(true)}
      />
      {rosterOpen && <WhoIsGoingSheet onClose={() => setRosterOpen(false)} />}
    </header>
  );
}
