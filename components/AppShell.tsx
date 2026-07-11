'use client';

import { useState } from 'react';
import { CalendarDays, Images, Wallet, Trophy } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import ItineraryTab from './tabs/ItineraryTab';
import PhotosTab from './tabs/PhotosTab';
import FinanceTab from './tabs/FinanceTab';
import StatsTab from './tabs/StatsTab';

type TabKey = 'itinerary' | 'photos' | 'finance' | 'stats';

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { key: 'photos', label: 'Photos', icon: Images },
  { key: 'finance', label: 'Money', icon: Wallet },
  { key: 'stats', label: 'Stats', icon: Trophy },
];

export default function AppShell() {
  const { demoMode } = useTripData();
  const [tab, setTab] = useState<TabKey>('itinerary');

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col bg-cream">
      {demoMode && (
        <div className="bg-ink/90 px-4 py-1.5 text-center text-[11px] text-cream">
          Demo mode — add Supabase keys in <code>.env.local</code> for realtime group sync
        </div>
      )}

      {/* top tab bar */}
      <nav className="sticky top-0 z-30 border-b border-black/5 bg-cream-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-stretch justify-around px-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
                {active && (
                  <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-ink" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="no-scrollbar flex-1 overflow-y-auto pb-10">
        {tab === 'itinerary' && <ItineraryTab />}
        {tab === 'photos' && <PhotosTab />}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'stats' && <StatsTab />}
      </main>
    </div>
  );
}
