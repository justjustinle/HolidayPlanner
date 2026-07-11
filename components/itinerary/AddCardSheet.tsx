'use client';

import { useState } from 'react';
import Sheet from '../ui/Sheet';
import { useTripData } from '../TripDataProvider';
import { TRIP_DAYS } from '@/lib/trip';

// Add a new itinerary card to a chosen day.
export default function AddCardSheet({
  defaultDay,
  onClose,
}: {
  defaultDay: number;
  onClose: () => void;
}) {
  const { addItineraryItem } = useTripData();
  const [day, setDay] = useState(defaultDay);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await addItineraryItem({
        day_number: day,
        time_label: time.trim() || 'Any time',
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
      <input
        value={time}
        onChange={(e) => setTime(e.target.value)}
        placeholder="Time, e.g. 8:00 AM or Evening"
        className={`${inputCls} mb-3`}
      />
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
