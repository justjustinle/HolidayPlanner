'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/** Accent bar width under each tab (centered on the button). */
const INDICATOR_WIDTH = 40;

const INDICATOR_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function AppShell() {
  const { demoMode } = useTripData();
  const [tab, setTab] = useState<TabKey>('itinerary');
  // SSR-safe init (no localStorage). Client effect below restores the stored
  // day when today is outside the trip.
  const [itineraryDay, setItineraryDay] = useState(
    () => dayNumberForDate(new Date()) ?? 1
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ x: 0, width: INDICATOR_WIDTH });
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    setItineraryDay(landingDayNumber());
  }, []);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const update = () => {
      const idx = TABS.findIndex((t) => t.key === tab);
      const btn = btnRefs.current[idx];
      if (!btn) return;
      const rowRect = row.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      // Center a fixed-width bar on the active tab button (left:0 + translateX).
      const center = btnRect.left - rowRect.left + btnRect.width / 2;
      setIndicator({
        x: center - INDICATOR_WIDTH / 2,
        width: INDICATOR_WIDTH,
      });
    };

    update();
    // Enable the slide only after the first layout so cold open doesn't animate
    // from x=0.
    const raf = requestAnimationFrame(() => {
      update();
      setMotionReady(true);
    });
    const ro = new ResizeObserver(update);
    ro.observe(row);
    for (const btn of btnRefs.current) {
      if (btn) ro.observe(btn);
    }
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [tab, demoMode]);

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
    <div className="city-tint mx-auto flex h-[100dvh] max-w-app flex-col overflow-hidden">
      {demoMode && (
        <div className="bg-ink/90 px-4 py-1.5 text-center text-[11px] text-cream">
          Demo mode — add Supabase keys in <code>.env.local</code> for realtime group sync
        </div>
      )}

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        {tab === 'itinerary' && (
          <ItineraryTab day={itineraryDay} onDayChange={setDay} />
        )}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'stats' && <StatsTab />}
      </main>

      {/* bottom tab bar */}
      <nav className="sticky bottom-0 z-30 border-t border-black/5 bg-cream-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div ref={rowRef} className="relative flex items-stretch justify-around px-2">
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-0.5 rounded-full will-change-transform"
            style={{
              width: indicator.width,
              background: 'var(--city-accent)',
              transform: `translate3d(${indicator.x}px, 0, 0)`,
              transition: motionReady
                ? `transform 320ms ${INDICATOR_EASE}`
                : 'none',
            }}
          />
          {TABS.map(({ key, label, icon: Icon }, i) => {
            const active = tab === key;
            return (
              <button
                key={key}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                onClick={() => selectTab(key)}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors duration-300 ${
                  active ? '' : 'text-muted'
                }`}
                style={active ? { color: 'var(--city-accent)' } : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
