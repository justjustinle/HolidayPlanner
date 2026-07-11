'use client';

import { useEffect, useRef } from 'react';
import { TRIP_DAYS } from '@/lib/trip';

// Horizontal Day 1 … Day 13 chip strip shown under each tab header. Pass
// allowAll to prepend an "All days" chip (value 0).
export default function DayPicker({
  value,
  onChange,
  allowAll = false,
}: {
  value: number; // 0 = all days (only when allowAll)
  onChange: (day: number) => void;
  allowAll?: boolean;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chip = (active: boolean) =>
    `flex flex-none flex-col items-center rounded-xl border px-3 py-1.5 leading-tight ${
      active ? 'border-ink bg-ink text-white' : 'border-black/10 bg-cream-card text-ink'
    }`;

  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-3">
      {allowAll && (
        <button
          onClick={() => onChange(0)}
          ref={value === 0 ? activeRef : undefined}
          className={chip(value === 0)}
        >
          <span className="text-[13px] font-semibold">All</span>
          <span className={`text-[10px] ${value === 0 ? 'text-white/70' : 'text-muted'}`}>
            whole trip
          </span>
        </button>
      )}
      {TRIP_DAYS.map((d) => {
        const active = value === d.dayNumber;
        return (
          <button
            key={d.dayNumber}
            onClick={() => onChange(d.dayNumber)}
            ref={active ? activeRef : undefined}
            className={chip(active)}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: d.accentHex }}
              />
              {d.label}
            </span>
            <span className={`text-[10px] ${active ? 'text-white/70' : 'text-muted'}`}>
              {d.dateLabel.slice(4)} · {d.destination}
            </span>
          </button>
        );
      })}
    </div>
  );
}
