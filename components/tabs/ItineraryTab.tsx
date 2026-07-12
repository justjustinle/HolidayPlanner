'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import ItineraryCard from '../itinerary/ItineraryCard';
import AddCardSheet from '../itinerary/AddCardSheet';
import TabHeader from '../ui/TabHeader';
import DayPicker from '../ui/DayPicker';
import { ThaiFlag, VietnamFlag } from '../ui/Flag';
import { dayByNumber, defaultDayNumber } from '@/lib/trip';
import { timeToMinutes } from '@/lib/time';

export default function ItineraryTab() {
  const { itinerary } = useTripData();
  const [day, setDay] = useState(defaultDayNumber);
  const [adding, setAdding] = useState(false);

  const selected = dayByNumber(day);

  // Theme the app after the selected day's city: its dot color becomes the
  // global accent (used by the tab bar, day chips, and add buttons).
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--city-accent',
      selected?.accentHex ?? '#c9992e'
    );
  }, [selected?.accentHex]);
  const items = useMemo(
    () =>
      itinerary
        .filter((i) => i.day_number === day)
        .sort((a, b) => timeToMinutes(a.time_label) - timeToMinutes(b.time_label)),
    [itinerary, day]
  );

  return (
    <div>
      <TabHeader
        title="Thailand & Vietnam"
        titleExtra={
          <span className="flex items-center gap-1.5">
            <ThaiFlag size={28} />
            <VietnamFlag size={28} />
          </span>
        }
      />

      <div className="px-5">
        <DayPicker value={day} onChange={setDay} />

        {selected && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span
                className="inline-block h-2 w-2 flex-none self-center rounded-full"
                style={{ background: selected.accentHex }}
              />
              <h2 className="font-serif text-[18px] text-ink">{selected.destination}</h2>
              <span className="text-[12px] text-muted">
                {selected.label} · {selected.dateLabel}
              </span>
            </div>
            <button
              onClick={() => setAdding(true)}
              aria-label="Add activity"
              className="flex h-8 flex-none items-center gap-1 rounded-full pl-2.5 pr-3 text-[13px] font-medium text-white shadow-card"
              style={{ background: selected.accentHex }}
            >
              <Plus size={15} />
              Add activity
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-muted">
            Nothing planned for {selected?.label ?? 'this day'} yet. Tap + to add an activity.
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {items.map((item) => (
              <ItineraryCard
                key={item.id}
                item={item}
                accentHex={selected?.accentHex ?? '#c9992e'}
              />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddCardSheet day={day} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
