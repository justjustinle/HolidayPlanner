'use client';

import { useState } from 'react';
import { CalendarDays, Wallet, Backpack } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import ItineraryTab from './tabs/ItineraryTab';
import FinanceTab from './tabs/FinanceTab';
import LogisticsTab from './tabs/LogisticsTab';

type TabKey = 'itinerary' | 'finance' | 'logistics';

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { key: 'finance', label: 'Money', icon: Wallet },
  { key: 'logistics', label: 'Logistics', icon: Backpack },
];

export default function AppShell() {
  const { me, demoMode } = useTripData();
  const [tab, setTab] = useState<TabKey>('itinerary');

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col bg-cream">
      {demoMode && (
        <div className="bg-ink/90 px-4 py-1.5 text-center text-[11px] text-cream">
          Demo mode — add Supabase keys in <code>.env.local</code> for realtime group sync
        </div>
      )}

      <main className="no-scrollbar flex-1 overflow-y-auto pb-24">
        {tab === 'itinerary' && <ItineraryTab />}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'logistics' && <LogisticsTab />}
      </main>

      {/* bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-black/5 bg-cream-card/95 backdrop-blur">
        <div className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {me && (
        <div className="pointer-events-none fixed left-1/2 top-2 z-40 hidden -translate-x-1/2">
          {/* reserved space; identity shown per-tab header */}
        </div>
      )}
    </div>
  );
}
