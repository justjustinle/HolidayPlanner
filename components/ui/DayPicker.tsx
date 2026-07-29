'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TRIP_DAYS, type TripDay } from '@/lib/trip';
import { MOTION } from '@/lib/motion';

const FADE =
  'color-mix(in srgb, var(--city-accent) 12%, #f7f1e6)';
const INDICATOR_WIDTH = 40;

// Horizontal Day 1 … Day 13 chip strip. Hints overflow with a peek + edge
// fades, and keeps the selected day scrolled to center when possible.
// Sticky below the trip header so day nav stays visible while the timeline scrolls.
export default function DayPicker({
  value,
  onChange,
  days = TRIP_DAYS,
}: {
  value: number;
  onChange: (day: number) => void;
  days?: TripDay[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const didCenter = useRef(false);
  const [edge, setEdge] = useState({ left: false, right: false });
  const [indicatorX, setIndicatorX] = useState(0);
  const [indicatorReady, setIndicatorReady] = useState(false);

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
  }, [value]);

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
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;

    const update = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const center =
        activeRect.left - scrollerRect.left + scroller.scrollLeft + activeRect.width / 2;
      setIndicatorX(center - INDICATOR_WIDTH / 2);
    };

    update();
    const raf = requestAnimationFrame(() => {
      update();
      setIndicatorReady(true);
    });
    const ro = new ResizeObserver(update);
    ro.observe(scroller);
    ro.observe(active);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [days, value]);

  // Selected: solid white + city accent outline; unselected: page bg + thin black outline.
  const chip = (active: boolean) =>
    `flex flex-none flex-col items-center rounded-xl border px-3 py-1.5 leading-tight text-ink ${
      active ? 'bg-cream-card' : 'border-black/25 bg-transparent'
    }`;

  return (
    <div className="sticky top-0 z-20 -mx-5" style={{ background: FADE }}>
      <div className="relative">
        <div
          ref={scrollerRef}
          data-swipe-ignore
          className="no-scrollbar relative flex gap-2 overflow-x-auto scroll-smooth py-3 pl-5 pr-14"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1 h-0.5 rounded-full will-change-transform"
            style={{
              left: 0,
              width: INDICATOR_WIDTH,
              background: 'var(--city-accent)',
              transform: `translate3d(${indicatorX}px, 0, 0)`,
              transition: indicatorReady
                ? `transform ${MOTION.indicator} ${MOTION.indicatorEase}`
                : 'none',
            }}
          />
          {days.map((d) => {
            const active = value === d.dayNumber;
            return (
              <button
                key={d.dayNumber}
                onClick={() => onChange(d.dayNumber)}
                ref={active ? activeRef : undefined}
                className={chip(active)}
                style={active ? { borderColor: d.accentHex } : undefined}
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
    </div>
  );
}
