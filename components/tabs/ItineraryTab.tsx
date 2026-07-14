'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import ItineraryCard from '../itinerary/ItineraryCard';
import NowMarker from '../itinerary/NowMarker';
import AddCardSheet from '../itinerary/AddCardSheet';
import TabHeader from '../ui/TabHeader';
import DayPicker from '../ui/DayPicker';
import { dayByNumber, dayNumberForDate, landingDayNumber } from '@/lib/trip';
import { YARN_DEFAULT_ACCENT, setYarnFavicon } from '@/lib/brand/setYarnFavicon';
import { nowToMinutes, timelineGapPx, timeToMinutes } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

type TimelineRow =
  | { kind: 'now' }
  | { kind: 'item'; item: ItineraryItem; past: boolean };

function rowStartLabel(row: TimelineRow, now: Date): string {
  if (row.kind === 'now') {
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return row.item.time_label;
}

export default function ItineraryTab() {
  const { itinerary } = useTripData();
  const [day, setDay] = useState(landingDayNumber);
  const [adding, setAdding] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const nowRef = useRef<HTMLDivElement>(null);
  const didScrollToNow = useRef(false);

  const selected = dayByNumber(day);
  const todayDay = dayNumberForDate(now);
  const isToday = todayDay !== null && day === todayDay;

  // Keep the "now" marker in sync with device time while this tab is open.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Theme the app after the selected day's city: its dot color becomes the
  // global accent (used by the tab bar, day chips, and add buttons).
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--city-accent',
      selected?.accentHex ?? YARN_DEFAULT_ACCENT
    );
  }, [selected?.accentHex]);

  const accent = selected?.accentHex ?? YARN_DEFAULT_ACCENT;

  // Themed yarn mark in the browser tab while this view is open.
  useEffect(() => {
    setYarnFavicon(accent);
    return () => setYarnFavicon(YARN_DEFAULT_ACCENT);
  }, [accent]);

  const items = useMemo(
    () =>
      itinerary
        .filter((i) => i.day_number === day)
        .sort((a, b) => timeToMinutes(a.time_label) - timeToMinutes(b.time_label)),
    [itinerary, day]
  );

  const rows: TimelineRow[] = useMemo(() => {
    if (!isToday) {
      return items.map((item) => ({ kind: 'item' as const, item, past: false }));
    }
    const nowMins = nowToMinutes(now);
    const out: TimelineRow[] = [];
    let inserted = false;
    for (const item of items) {
      const t = timeToMinutes(item.time_label);
      if (!inserted && nowMins < t) {
        out.push({ kind: 'now' });
        inserted = true;
      }
      out.push({ kind: 'item', item, past: t < nowMins });
    }
    if (!inserted) out.push({ kind: 'now' });
    return out;
  }, [items, isToday, now]);

  // Scroll the now marker into view once when (re)landing on today.
  useEffect(() => {
    if (!isToday) {
      didScrollToNow.current = false;
      return;
    }
    if (didScrollToNow.current) return;
    const el = nowRef.current;
    if (!el) return;
    didScrollToNow.current = true;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [isToday, rows]);

  const showEmpty = items.length === 0 && !isToday;

  return (
    <div>
      <TabHeader />

      <div className="px-5">
        <DayPicker value={day} onChange={setDay} />

        {selected && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <span
                className="mt-2 inline-block h-2 w-2 flex-none rounded-full"
                style={{ background: selected.accentHex }}
              />
              <div className="min-w-0">
                <h2 className="font-serif text-[18px] leading-tight text-ink">
                  {selected.destination}
                </h2>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">
                  {selected.label} · {selected.dateLabel}
                  {isToday && (
                    <span className="ml-1 font-medium text-ink">· Today</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdding(true)}
              aria-label="Add activity"
              className="flex h-8 flex-none items-center gap-1 rounded-full pl-2.5 pr-3 text-[13px] font-medium text-cream-card"
              style={{ background: selected.accentHex }}
            >
              <Plus size={15} />
              Add activity
            </button>
          </div>
        )}

        {showEmpty ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-muted">
            Nothing planned for {selected?.label ?? 'this day'} yet. Tap + to add an activity.
          </div>
        ) : (
          <div className="pb-24 pt-1">
            {rows.map((row, i) => {
              const isLast = i === rows.length - 1;
              const next = rows[i + 1];
              const spacingAfter = isLast
                ? 8
                : timelineGapPx(
                    rowStartLabel(row, now),
                    next ? rowStartLabel(next, now) : null
                  );
              if (row.kind === 'now') {
                return (
                  <NowMarker
                    key="now"
                    ref={nowRef}
                    now={now}
                    accentHex={accent}
                    isLast={isLast}
                    spacingAfter={spacingAfter}
                  />
                );
              }
              return (
                <ItineraryCard
                  key={row.item.id}
                  item={row.item}
                  accentHex={accent}
                  isLast={isLast}
                  dimmed={row.past}
                  spacingAfter={spacingAfter}
                />
              );
            })}
            {items.length === 0 && isToday && (
              <div className="mt-2 rounded-2xl border-2 border-dashed border-black/10 p-6 text-center text-[13px] text-muted">
                Nothing planned for today yet. Tap + to add an activity.
              </div>
            )}
          </div>
        )}
      </div>

      {adding && (
        <AddCardSheet day={day} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
