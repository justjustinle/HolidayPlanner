'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Sheet from '../ui/Sheet';
import TimeWheel from '../ui/TimeWheel';
import { useTripData } from '../TripDataProvider';
import { dayByNumber } from '@/lib/trip';
import {
  buildTimeLabel,
  isEndAfterStart,
  parseTimeLabel,
  type TimeValue,
} from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

function defaultEndAfter(start: TimeValue): TimeValue {
  const total = start.hour24 * 60 + start.minute + 60;
  const capped = Math.min(total, 23 * 60 + 55);
  return { hour24: Math.floor(capped / 60), minute: capped % 60 };
}

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
  const [endTime, setEndTime] = useState<TimeValue | null>(() =>
    item?.end_time_label ? parseTimeLabel(item.end_time_label) : null
  );
  const [title, setTitle] = useState(item?.title ?? '');
  const [location, setLocation] = useState(item?.location ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [busy, setBusy] = useState(false);

  const dayNumber = item?.day_number ?? day;
  const d = dayByNumber(dayNumber);
  const startLabel = buildTimeLabel(time);
  const endLabel = endTime ? buildTimeLabel(endTime) : null;
  const endInvalid = Boolean(endLabel && !isEndAfterStart(startLabel, endLabel));

  const save = async () => {
    if (!title.trim() || busy || endInvalid) return;
    setBusy(true);
    try {
      const payload = {
        day_number: dayNumber,
        time_label: startLabel,
        end_time_label: endLabel,
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

      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
        Starts
      </label>
      <div className="mb-3">
        <TimeWheel value={time} onChange={setTime} />
      </div>

      {endTime ? (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs uppercase tracking-wide text-muted">Ends</label>
            <button
              type="button"
              onClick={() => setEndTime(null)}
              className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
            >
              <X size={12} /> Remove end
            </button>
          </div>
          <TimeWheel value={endTime} onChange={setEndTime} />
          {endInvalid && (
            <p className="mt-2 text-[12px] text-saigon">
              End time must be after the start.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEndTime(defaultEndAfter(time))}
          className="mb-3 w-full rounded-xl border border-dashed border-black/15 bg-transparent px-4 py-2.5 text-[14px] text-muted hover:border-black/25 hover:text-ink"
        >
          Add end time
        </button>
      )}

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
        disabled={!title.trim() || busy || endInvalid}
        className="w-full rounded-xl py-3 text-[15px] font-medium text-white disabled:opacity-40"
        style={{ background: 'var(--city-accent, #3a352c)' }}
      >
        {editing ? 'Save changes' : 'Add to itinerary'}
      </button>
    </Sheet>
  );
}
