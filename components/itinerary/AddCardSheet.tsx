'use client';

import { useState } from 'react';
import Sheet from '../ui/Sheet';
import TimeWheel from '../ui/TimeWheel';
import { useTripData } from '../TripDataProvider';
import { TRIP_DAYS } from '@/lib/trip';
import { buildTimeLabel, type TimeValue } from '@/lib/time';

// Add a new itinerary card to a chosen day, with a fixed scrollable time wheel.
export default function AddCardSheet({
  defaultDay,
  onClose,
}: {
  defaultDay: number;
  onClose: () => void;
}) {
  const { addItineraryItem } = useTripData();
  const [day, setDay] = useState(defaultDay);
  const [time, setTime] = useState<TimeValue>({ hour12: 9, minute: 0, period: 'AM' });
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await addItineraryItem({
        day_number: day,
        time_label: buildTimeLabel(time),
        title: title.trim(),
        location: location.trim() || null,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink';

  return (
    <Sheet title="New activity" onClose={onClose}>
      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Day</label>
      <select
        value={day}
        onChange={(e) => setDay(Number(e.target.value))}
        className={`${inputCls} mb-3 appearance-none`}
      >
        {TRIP_DAYS.map((d) => (
          <option key={d.dayNumber} value={d.dayNumber}>
            {d.label} · {d.destination} · {d.dateLabel}
          </option>
        ))}
      </select>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Activity name"
        autoFocus
        className={`${inputCls} mb-3`}
      />

      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Time</label>
      <div className="mb-3">
        <TimeWheel value={time} onChange={setTime} />
      </div>

      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location or Google Maps link"
        className={`${inputCls} mb-6`}
      />

      <button
        onClick={save}
        disabled={!title.trim() || busy}
        className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
      >
        Add to itinerary
      </button>
    </Sheet>
  );
}
