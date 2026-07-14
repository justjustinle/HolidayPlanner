'use client';

import { useEffect, useRef, useState } from 'react';
import { TRIP_DAYS } from '@/lib/trip';

const FADE =
  'color-mix(in srgb, var(--city-accent) 12%, #f7f1e6)';

// Horizontal Day 1 … Day 13 chip strip. Hints overflow with a peek + edge
// fades, and keeps the selected day scrolled to center when possible.
export default function DayPicker({
  value,
  onChange,
  allowAll = false,
}: {
  value: number; // 0 = all days (only when allowAll)
  onChange: (day: number) => void;
  allowAll?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const didCenter = useRef(false);
  const [edge, setEdge] = useState({ left: false, right: false });

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({
      left: el.scrollLeft > 4,
      right: max > 4 && el.scrollLeft < max - 4,
    });
  };

  // Center the selected chip whenever it changes. First paint uses instant
  // scroll so the strip doesn’t animate on load.
  useEffect(() => {
    const node = activeRef.current;
    if (!node) return;
    node.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: didCenter.current ? 'smooth' : 'auto',
    });
    didCenter.current = true;
    // Edges update after layout settles from scrollIntoView.
    const id = window.setTimeout(updateEdges, 80);
    return () => window.clearTimeout(id);
  }, [value, allowAll]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      ro.disconnect();
    };
  }, [allowAll]);

  // Selected: tinted fill + accent border + shadow; unselected: transparent ghost outline.
  const chip = (active: boolean) =>
    `flex flex-none flex-col items-center rounded-xl border px-3 py-1.5 leading-tight text-ink ${
      active ? 'shadow-card' : 'border-black/25 bg-transparent'
    }`;

  return (
    <div className="relative -mx-5">
      <div
        ref={scrollerRef}
        className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth py-3 pl-5 pr-14"
      >
        {allowAll && (
          <button
            onClick={() => onChange(0)}
            ref={value === 0 ? activeRef : undefined}
            className={chip(value === 0)}
            style={value === 0 ? { background: '#3a352c' } : undefined}
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
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${d.accentHex} 20%, #fdfbf5)`,
                      borderColor: d.accentHex,
                    }
                  : undefined
              }
            >
              <span className={`text-[13px] ${active ? 'font-bold' : 'font-semibold'}`}>
                {d.dateLabel}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: d.accentHex }}
                />
                {d.label}. {d.destination}
              </span>
            </button>
          );
        })}
        {/* Trailing spacer so late chips (and the selected day) can sit centered
            instead of flushing against the right edge. */}
        <div className="w-[30vw] min-w-[80px] max-w-[140px] flex-none" aria-hidden />
      </div>

      {edge.left && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-11"
          style={{
            background: `linear-gradient(to right, ${FADE}, transparent)`,
          }}
          aria-hidden
        />
      )}
      {edge.right && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-11"
          style={{
            background: `linear-gradient(to left, ${FADE}, transparent)`,
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
