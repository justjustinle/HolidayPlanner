'use client';

import { useState } from 'react';
import Sheet from '../ui/Sheet';
import TimeWheel from '../ui/TimeWheel';
import { useTripData } from '../TripDataProvider';
import { dayByNumber } from '@/lib/trip';
import { buildTimeLabel, parseTimeLabel, type TimeValue } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

// Add or edit an itinerary card. Pass `item` to edit — anyone can change any
// activity (title, time, location, notes). Day stays the one currently selected /
// the item's existing day.
export default function AddCardSheet({
  day,
  item,
  onClose,
}: {
  day: number;
  item?: ItineraryItem;
  onClose: () => void;
}) {
  const { addItineraryItem, updateItineraryItem } = useTripData();
  const editing = Boolean(item);
  const [time, setTime] = useState<TimeValue>(() =>
    item ? parseTimeLabel(item.time_label) : { hour24: 9, minute: 0 }
  );
  const [title, setTitle] = useState(item?.title ?? '');
  const [location, setLocation] = useState(item?.location ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [busy, setBusy] = useState(false);

  const dayNumber = item?.day_number ?? day;
  const d = dayByNumber(dayNumber);

  const save = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const payload = {
        day_number: dayNumber,
        time_label: buildTimeLabel(time),
        title: title.trim(),
        location: location.trim() || null,
        notes: notes.trim() || null,
      };
      if (item) {
        await updateItineraryItem(item.id, payload);
      } else {
        await addItineraryItem(payload);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink';

  return (
    <Sheet title={editing ? 'Edit activity' : 'New activity'} onClose={onClose}>
      {d && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-black/[.04] px-4 py-2.5 text-[13px] text-muted">
          <span
            className="inline-block h-2 w-2 flex-none rounded-full"
            style={{ background: d.accentHex }}
          />
          {editing ? 'Editing on' : 'Adding to'}{' '}
          <span className="font-medium text-ink">{d.label}</span> · {d.destination} ·{' '}
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
        className={`${inputCls} mb-3`}
      />

      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Booking ref, meet point, bring sunscreen…"
        rows={3}
        className={`${inputCls} mb-6 resize-none`}
      />

      <button
        onClick={save}
        disabled={!title.trim() || busy}
        className="w-full rounded-xl py-3 text-[15px] font-medium text-white disabled:opacity-40"
        style={{ background: 'var(--city-accent, #3a352c)' }}
      >
        {editing ? 'Save changes' : 'Add to itinerary'}
      </button>
    </Sheet>
  );
}
