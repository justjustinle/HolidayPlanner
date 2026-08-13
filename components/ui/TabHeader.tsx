'use client';

import { useState } from 'react';
import { Calendar, Menu, Users } from 'lucide-react';
import AppDrawer from './AppDrawer';
import TravelerFacepile from './TravelerFacepile';
import WhoIsGoingSheet from './WhoIsGoingSheet';
import InviteFriendsSheet from './InviteFriendsSheet';
import EditNameSheet from './EditNameSheet';
import CreateTripSheet from '../trips/CreateTripSheet';
import ChecklistSheet, { ChecklistStrip } from '../checklist/ChecklistSheet';
import YarnLogo from '../brand/YarnLogo';
import { CountryFlag } from './Flag';
import {
  countryFromDestinationLabel,
  normalizeCountryName,
} from '@/lib/countries';
import { dayByNumber, rangeLabelFromDays, type TripDay } from '@/lib/trip';
import { useTripData } from '../TripDataProvider';

type TabHeaderProps =
  | {
      /** Itinerary-only trip identity chrome. */
      variant?: 'trip';
      title?: never;
      /** Selected itinerary day — drives the city→country flag. */
      dayNumber?: number;
    }
  | {
      /** Expenses / Stats: page title + Yarn mark top-right. */
      variant: 'section';
      title: string;
      dayNumber?: never;
    };

// Shared two-column trip header: 40px icon rail + flexible content.
const TRIP_HEADER_GRID = 'grid grid-cols-[40px_1fr]';

/**
 * Flag width (3:2). Height ≈ date row + facepile row so it sits flush with
 * those two meta lines on the right.
 */
const CITY_FLAG_SIZE = 61; // ~15% smaller than 72

function countryForTripDay(day: TripDay | undefined): string | null {
  if (!day) return null;
  if (day.country) {
    return normalizeCountryName(day.country) ?? day.country;
  }
  const city = (day.city ?? day.destination)?.trim();
  if (city) {
    const fromCity = countryFromDestinationLabel(city);
    if (fromCity) return fromCity;
  }
  return day.destination
    ? countryFromDestinationLabel(day.destination)
    : null;
}

// Itinerary: hamburger + trip title; dates/facepile with city country flag.
// Expenses & Stats: hamburger + section title, Yarn logo top-right (no trip chrome).
export default function TabHeader(props: TabHeaderProps) {
  const isTrip = props.variant !== 'section';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const { trip, tripDays } = useTripData();
  const dates = rangeLabelFromDays(tripDays);
  const selectedDay = isTrip
    ? dayByNumber(props.dayNumber ?? 1, tripDays)
    : undefined;
  const cityCountry = countryForTripDay(selectedDay);

  return (
    <header className="px-5 pt-4">
      {isTrip ? (
        <div>
          {/* Title row — full width, no flag */}
          <div className={TRIP_HEADER_GRID}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-black/5"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            <h1 className="min-w-0 self-center truncate font-serif text-[26px] font-semibold leading-tight text-ink">
              {trip.name}
            </h1>
          </div>

          {/* Date + facepile, with country flag aligned to both rows */}
          <div className="mt-1 flex items-stretch gap-3">
            <div className={`${TRIP_HEADER_GRID} min-w-0 flex-1`}>
              <span
                className="flex items-center justify-center text-muted"
                aria-hidden
              >
                <Calendar size={14} />
              </span>
              <p className="self-center text-[13px] leading-snug text-muted">
                {dates}
              </p>

              <span
                className="mt-2 flex items-center justify-center text-muted"
                aria-hidden
              >
                <Users size={14} />
              </span>
              <div className="mt-2 self-center">
                <TravelerFacepile
                  onOpen={() => setRosterOpen(true)}
                  size={23}
                />
              </div>
            </div>

            {cityCountry && (
              <div className="flex flex-none items-center justify-center">
                <CountryFlag country={cityCountry} size={CITY_FLAG_SIZE} />
              </div>
            )}
          </div>

          {/* Trip-level checklist — sits in the header above day pills. */}
          <ChecklistStrip onOpen={() => setChecklistOpen(true)} />
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
        onOpenInvite={() => setInviteOpen(true)}
        onOpenEditName={() => setEditNameOpen(true)}
        onOpenEditTrip={() => setEditTripOpen(true)}
      />
      {rosterOpen && <WhoIsGoingSheet onClose={() => setRosterOpen(false)} />}
      {inviteOpen && <InviteFriendsSheet onClose={() => setInviteOpen(false)} />}
      {editNameOpen && <EditNameSheet onClose={() => setEditNameOpen(false)} />}
      {editTripOpen && (
        <CreateTripSheet mode="edit" onClose={() => setEditTripOpen(false)} />
      )}
      {checklistOpen && <ChecklistSheet onClose={() => setChecklistOpen(false)} />}
    </header>
  );
}
