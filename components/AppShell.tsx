'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Wallet, Trophy } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import ItineraryTab from './tabs/ItineraryTab';
import FinanceTab from './tabs/FinanceTab';
import StatsTab from './tabs/StatsTab';
import {
  dayNumberForDate,
  landingDayNumber,
  writeStoredItineraryDay,
} from '@/lib/trip';

type TabKey = 'itinerary' | 'finance' | 'stats';

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { key: 'finance', label: 'Expenses', icon: Wallet },
  { key: 'stats', label: 'Stats', icon: Trophy },
];

// Prefer the device-local trip day when it matches a pill; otherwise keep the
// last day the user had selected (in-memory + localStorage across cold opens).
function resolveItineraryDay(previous: number): number {
  return dayNumberForDate(new Date()) ?? previous;
}

export default function AppShell() {
  const { demoMode } = useTripData();
  const [tab, setTab] = useState<TabKey>('itinerary');
  // SSR-safe init (no localStorage). Client effect below restores the stored
  // day when today is outside the trip.
  const [itineraryDay, setItineraryDay] = useState(
    () => dayNumberForDate(new Date()) ?? 1
  );

  useEffect(() => {
    setItineraryDay(landingDayNumber());
  }, []);

  const setDay = (day: number) => {
    setItineraryDay(day);
    writeStoredItineraryDay(day);
  };

  const selectTab = (key: TabKey) => {
    if (key === 'itinerary') {
      setItineraryDay((prev) => {
        const next = resolveItineraryDay(prev);
        writeStoredItineraryDay(next);
        return next;
      });
    }
    setTab(key);
  };

  return (
    <div className="city-tint mx-auto flex min-h-[100dvh] max-w-app flex-col">
      {demoMode && (
        <div className="bg-ink/90 px-4 py-1.5 text-center text-[11px] text-cream">
          Demo mode — add Supabase keys in <code>.env.local</code> for realtime group sync
        </div>
      )}

      <main className="no-scrollbar flex-1 overflow-y-auto pb-10">
        {tab === 'itinerary' && (
          <ItineraryTab day={itineraryDay} onDayChange={setDay} />
        )}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'stats' && <StatsTab />}
      </main>

      {/* bottom tab bar */}
      <nav className="sticky bottom-0 z-30 border-t border-black/5 bg-cream-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="flex items-stretch justify-around px-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => selectTab(key)}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? '' : 'text-muted'
                }`}
                style={active ? { color: 'var(--city-accent)' } : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
                {active && (
                  <span
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full"
                    style={{ background: 'var(--city-accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
