'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { HOURS, MINUTES, PERIODS, type TimeValue } from '@/lib/time';

const ITEM_H = 32; // px per row
const VISIBLE = 3; // one above + selected + one below
const PAD = (ITEM_H * (VISIBLE - 1)) / 2;

interface Item {
  value: string | number;
  label: string;
}

// A single scroll-snapping wheel column. Items snap to centre; the selected
// value is whichever item is centred in the highlight band.
function WheelColumn({
  items,
  value,
  onSelect,
}: {
  items: Item[];
  value: string | number;
  onSelect: (v: string | number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const indexOf = (v: string | number) =>
    Math.max(0, items.findIndex((it) => it.value === v));

  // Position on first paint without animation.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = indexOf(valueRef.current) * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync if the value is changed from elsewhere (not by this column's scroll).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = indexOf(value) * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const idx = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      const it = items[idx];
      if (it && it.value !== valueRef.current) onSelect(it.value);
    }, 90);
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="no-scrollbar snap-y snap-mandatory overflow-y-auto overscroll-contain"
      style={{ height: VISIBLE * ITEM_H }}
    >
      <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
        {items.map((it) => {
          const active = it.value === value;
          return (
            <div
              key={String(it.value)}
              onClick={() => onSelect(it.value)}
              className={`flex snap-center items-center justify-center transition-all ${
                active ? 'text-[16px] font-semibold text-ink' : 'text-[13px] text-muted/55'
              }`}
              style={{ height: ITEM_H }}
            >
              {it.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hour / minute / AM-PM wheel. Fixed choices, scrollable — no free text.
export default function TimeWheel({
  value,
  onChange,
}: {
  value: TimeValue;
  onChange: (v: TimeValue) => void;
}) {
  const hourItems: Item[] = HOURS.map((h) => ({ value: h, label: String(h) }));
  const minItems: Item[] = MINUTES.map((m) => ({
    value: m,
    label: String(m).padStart(2, '0'),
  }));
  const periodItems: Item[] = PERIODS.map((p) => ({ value: p, label: p }));

  return (
    <div className="relative rounded-xl border border-black/10 bg-cream-card">
      {/* centered selection band */}
      <div
        className="pointer-events-none absolute inset-x-2 z-10 rounded-md border-y border-black/10 bg-black/[0.03]"
        style={{ top: PAD, height: ITEM_H }}
      />
      <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center px-2">
        <WheelColumn
          items={hourItems}
          value={value.hour12}
          onSelect={(v) => onChange({ ...value, hour12: Number(v) })}
        />
        <div className="text-[16px] font-semibold text-muted">:</div>
        <WheelColumn
          items={minItems}
          value={value.minute}
          onSelect={(v) => onChange({ ...value, minute: Number(v) })}
        />
        <WheelColumn
          items={periodItems}
          value={value.period}
          onSelect={(v) => onChange({ ...value, period: v as 'AM' | 'PM' })}
        />
      </div>
    </div>
  );
}
