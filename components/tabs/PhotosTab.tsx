'use client';

import { useMemo, useState } from 'react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import DayPicker from '../ui/DayPicker';
import PolaroidCarousel from '../itinerary/PolaroidCarousel';
import { dayByNumber, defaultDayNumber } from '@/lib/trip';
import { timeToMinutes } from '@/lib/time';

// Day-by-day photo wall: one Polaroid carousel per activity. Adding, tagging,
// and saving photos works here exactly like on the itinerary cards.
export default function PhotosTab() {
  const { itinerary, photos } = useTripData();
  const [day, setDay] = useState(defaultDayNumber);

  const selected = dayByNumber(day);
  const activities = useMemo(
    () =>
      itinerary
        .filter((i) => i.day_number === day)
        .sort((a, b) => timeToMinutes(a.time_label) - timeToMinutes(b.time_label)),
    [itinerary, day]
  );

  const dayPhotoCount = useMemo(() => {
    const ids = new Set(activities.map((a) => a.id));
    return photos.filter((p) => ids.has(p.activity_id)).length;
  }, [activities, photos]);

  return (
    <div>
      <TabHeader eyebrow="Polaroid memories" title="Photos" />

      <div className="px-5 pb-10">
        <DayPicker value={day} onChange={setDay} />

        {selected && (
          <div className="mb-3 flex items-baseline gap-2">
            <span
              className="inline-block h-2 w-2 flex-none rounded-full"
              style={{ background: selected.accentHex }}
            />
            <h2 className="font-serif text-[18px] text-ink">{selected.destination}</h2>
            <span className="text-[12px] text-muted">
              {selected.label} · {dayPhotoCount} photo{dayPhotoCount === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-muted">
            No activities on {selected?.label ?? 'this day'} yet — add one in the
            Itinerary tab, then fill its Polaroid here.
          </div>
        ) : (
          <div className="space-y-5">
            {activities.map((item) => (
              <div key={item.id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-ink">{item.title}</span>
                  <span className="text-[11px] text-muted">{item.time_label}</span>
                </div>
                <PolaroidCarousel item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
