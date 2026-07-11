'use client';

import { useMemo, useState } from 'react';
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
            <ThaiFlag size={22} />
            <VietnamFlag size={22} />
          </span>
        }
      />

      <div className="px-5">
        <DayPicker value={day} onChange={setDay} />

        {selected && (
          <div className="mb-3 flex items-baseline gap-2">
            <span
              className="inline-block h-2 w-2 flex-none rounded-full"
              style={{ background: selected.accentHex }}
            />
            <h2 className="font-serif text-[18px] text-ink">{selected.destination}</h2>
            <span className="text-[12px] text-muted">
              {selected.label} · {selected.dateLabel}
            </span>
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

      {/* floating add button */}
      <button
        onClick={() => setAdding(true)}
        aria-label="Add activity"
        className="fixed bottom-6 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white shadow-polaroid"
        style={{ marginLeft: 'calc(min(50vw, 240px) - 44px)' }}
      >
        <Plus size={26} />
      </button>

      {adding && (
        <AddCardSheet defaultDay={day} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
