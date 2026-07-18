'use client';

import { useState } from 'react';
import { Calendar, Menu, Users } from 'lucide-react';
import AppDrawer from './AppDrawer';
import TravelerFacepile from './TravelerFacepile';
import WhoIsGoingSheet from './WhoIsGoingSheet';
import YarnLogo from '../brand/YarnLogo';
import { ThaiFlag, VietnamFlag } from './Flag';
import { rangeLabelFromDays } from '@/lib/trip';
import { useTripData } from '../TripDataProvider';

type TabHeaderProps =
  | {
      /** Itinerary-only trip identity chrome. */
      variant?: 'trip';
      title?: never;
    }
  | {
      /** Expenses / Stats: page title + Yarn mark top-right. */
      variant: 'section';
      title: string;
    };

// Shared two-column trip header: 40px icon rail + flexible content.
const TRIP_HEADER_GRID = 'grid grid-cols-[40px_1fr]';

// Itinerary: hamburger + trip title/flags/dates/facepile.
// Expenses & Stats: hamburger + section title, Yarn logo top-right (no trip chrome).
export default function TabHeader(props: TabHeaderProps) {
  const isTrip = props.variant !== 'section';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const { trip, tripDays } = useTripData();
  const dates = rangeLabelFromDays(tripDays);

  return (
    <header className="px-5 pt-4">
      {isTrip ? (
        <div className={TRIP_HEADER_GRID}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-black/5"
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <h1 className="flex min-w-0 items-center gap-2 font-serif text-[26px] font-semibold leading-tight text-ink">
            <span className="min-w-0 truncate">{trip.name}</span>
            <span
              className="inline-flex shrink-0 items-center gap-1"
              aria-label="Thailand and Vietnam"
            >
              <ThaiFlag size={20} />
              <VietnamFlag size={20} />
            </span>
          </h1>

          <span className="mt-1 flex items-center justify-center text-muted" aria-hidden>
            <Calendar size={14} />
          </span>
          <p className="mt-1 text-[13px] leading-snug text-muted">{dates}</p>

          <span className="mt-2 flex items-center justify-center text-muted" aria-hidden>
            <Users size={14} />
          </span>
          <div className="mt-2">
            <TravelerFacepile onOpen={() => setRosterOpen(true)} size={23} />
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
