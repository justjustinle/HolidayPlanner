'use client';

import { useState } from 'react';
import { Calendar, Menu } from 'lucide-react';
import AppDrawer from './AppDrawer';
import TravelerFacepile, { TRIP_META_ICON_GRID } from './TravelerFacepile';
import WhoIsGoingSheet from './WhoIsGoingSheet';
import YarnLogo from '../brand/YarnLogo';
import { ThaiFlag, VietnamFlag } from './Flag';
import { TRIP_TITLE, tripDateRangeLabel } from '@/lib/trip';

type TabHeaderProps =
  | {
      /** Itinerary-only trip identity chrome. */
      variant?: 'trip';
      title?: never;
      action?: React.ReactNode;
    }
  | {
      /** Expenses / Stats: page title + Yarn mark top-right. */
      variant: 'section';
      title: string;
      action?: React.ReactNode;
    };

// Itinerary: hamburger + trip title/flags/dates/facepile.
// Expenses & Stats: hamburger + section title, Yarn logo top-right (no trip chrome).
export default function TabHeader(props: TabHeaderProps) {
  const { action } = props;
  const isTrip = props.variant !== 'section';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const dates = tripDateRangeLabel();

  return (
    <header className="px-5 pt-4">
      {isTrip ? (
        <div className="grid grid-cols-[auto_1fr] gap-x-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="row-start-1 flex h-10 w-10 flex-none items-center justify-center self-center rounded-full text-ink hover:bg-black/5"
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <h1 className="col-start-2 row-start-1 flex min-w-0 items-center gap-2 self-center font-serif text-[26px] font-semibold leading-tight text-ink">
            <span className="min-w-0 truncate">{TRIP_TITLE}</span>
            <span
              className="inline-flex shrink-0 items-center gap-1"
              aria-label="Thailand and Vietnam"
            >
              <ThaiFlag size={20} />
              <VietnamFlag size={20} />
            </span>
          </h1>
          <div className="col-start-2 row-start-2 mt-1 flex flex-col gap-2">
            <div className={TRIP_META_ICON_GRID}>
              <Calendar size={14} className="mx-auto flex-none text-muted" aria-hidden />
              <p className="text-[13px] leading-snug text-muted">{dates}</p>
            </div>
            <div className="flex items-center gap-3">
              <TravelerFacepile onOpen={() => setRosterOpen(true)} size={23} />
              {action}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-ink hover:bg-black/5"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            <h1 className="min-w-0 truncate font-serif text-[28px] font-semibold leading-none text-ink">
              {props.title}
            </h1>
            {action}
          </div>
          <span
            className="flex flex-none items-center text-[var(--city-accent)]"
            aria-hidden
          >
            <YarnLogo size={36} color="currentColor" />
          </span>
        </div>
      )}

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenRoster={() => setRosterOpen(true)}
      />
      {rosterOpen && <WhoIsGoingSheet onClose={() => setRosterOpen(false)} />}
    </header>
  );
}
