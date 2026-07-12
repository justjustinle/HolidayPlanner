'use client';

import { useState } from 'react';
import Sheet from '../ui/Sheet';
import TimeWheel from '../ui/TimeWheel';
import { useTripData } from '../TripDataProvider';
import { dayByNumber } from '@/lib/trip';
import { buildTimeLabel, type TimeValue } from '@/lib/time';

// Add a new itinerary card to the day currently selected in the itinerary,
// with a fixed scrollable time wheel.
export default function AddCardSheet({
  day,
  onClose,
}: {
  day: number;
  onClose: () => void;
}) {
  const { addItineraryItem } = useTripData();
  const [time, setTime] = useState<TimeValue>({ hour12: 9, minute: 0, period: 'AM' });
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const d = dayByNumber(day);

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
      {d && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-black/[.04] px-4 py-2.5 text-[13px] text-muted">
          <span
            className="inline-block h-2 w-2 flex-none rounded-full"
            style={{ background: d.accentHex }}
          />
          Adding to <span className="font-medium text-ink">{d.label}</span> · {d.destination} ·{' '}
          {d.dateLabel}
        </div>
      )}

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
        className="w-full rounded-xl py-3 text-[15px] font-medium text-white disabled:opacity-40"
        style={{ background: 'var(--city-accent, #3a352c)' }}
      >
        Add to itinerary
      </button>
    </Sheet>
  );
}
