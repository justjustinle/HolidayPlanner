'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import ItineraryCard from '../itinerary/ItineraryCard';
import AddCardSheet from '../itinerary/AddCardSheet';
import TabHeader from '../ui/TabHeader';
import { TRIP_DAYS, dayByNumber } from '@/lib/trip';
import { timeToMinutes } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

export default function ItineraryTab() {
  const { itinerary } = useTripData();
  const [adding, setAdding] = useState(false);

  // Group cards by day, in trip order. Only render days that have cards.
  const byDay = useMemo(() => {
    const map = new Map<number, ItineraryItem[]>();
    for (const item of itinerary) {
      const list = map.get(item.day_number) ?? [];
      list.push(item);
      map.set(item.day_number, list);
    }
    return TRIP_DAYS.filter((d) => map.has(d.dayNumber)).map((d) => ({
      day: d,
      // Order activities chronologically within the day.
      items: map
        .get(d.dayNumber)!
        .slice()
        .sort((a, b) => timeToMinutes(a.time_label) - timeToMinutes(b.time_label)),
    }));
  }, [itinerary]);

  return (
    <div>
      <TabHeader
        eyebrow="28 Aug – 10 Sep · 4 stops"
        title="Vietnam & Thailand"
      />

      <div className="px-5 pt-2">
        {byDay.length === 0 && (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-muted">
            No activities yet. Tap the + button to plan your first day.
          </div>
        )}

        {byDay.map(({ day, items }) => (
          <section key={day.dayNumber} className="mb-7">
            <div className="mb-3 flex items-baseline gap-2">
              <span
                className="inline-block h-2 w-2 flex-none rounded-full"
                style={{ background: day.accentHex }}
              />
              <h2 className="font-serif text-[18px] text-ink">{day.destination}</h2>
              <span className="text-[12px] text-muted">
                {day.label} · {day.dateLabel}
              </span>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <ItineraryCard
                  key={item.id}
                  item={item}
                  accentHex={dayByNumber(item.day_number)?.accentHex ?? '#c9992e'}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* floating add button */}
      <button
        onClick={() => setAdding(true)}
        aria-label="Add activity"
        className="fixed bottom-24 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white shadow-polaroid"
        style={{ marginLeft: 'calc(min(50vw, 240px) - 44px)' }}
      >
        <Plus size={26} />
      </button>

      {adding && (
        <AddCardSheet
          defaultDay={byDay[byDay.length - 1]?.day.dayNumber ?? 1}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
