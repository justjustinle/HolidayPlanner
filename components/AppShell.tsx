'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays, Wallet, Trophy } from 'lucide-react';
import { useTripData } from './TripDataProvider';
import ItineraryTab from './tabs/ItineraryTab';
import FinanceTab from './tabs/FinanceTab';
import StatsTab from './tabs/StatsTab';
import {
  dayNumberForDate,
  landingDayNumber,
  writeStoredItineraryDay,
} from '@/lib/trip';
import { hapticLight, MOTION } from '@/lib/motion';

type TabKey = 'itinerary' | 'finance' | 'stats';

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { key: 'finance', label: 'Expenses', icon: Wallet },
  { key: 'stats', label: 'Stats', icon: Trophy },
];

const TAB_ORDER: TabKey[] = TABS.map((t) => t.key);

/** Claim horizontal once movement exceeds this (px). */
const AXIS_LOCK_PX = 8;
/** Commit page if dragged past this fraction of width. */
const COMMIT_DISTANCE = 0.18;
/** Commit on a flick (px/ms). */
const COMMIT_VELOCITY = 0.45;
/** Edge rubber-band factor when there’s no next/prev tab. */
const EDGE_RESIST = 0.28;
/** Settle animation after release. */
const PAGE_SETTLE_MS = 280;
const PAGE_SETTLE_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

// Prefer the device-local trip day when it matches a pill; otherwise keep the
// last day the user had selected (in-memory + localStorage across cold opens).
function resolveItineraryDay(previous: number): number {
  return dayNumberForDate(new Date()) ?? previous;
}

/** Accent bar width under each tab (centered on the button). */
const INDICATOR_WIDTH = 40;

export default function AppShell() {
  const { demoMode } = useTripData();
  const [tabIndex, setTabIndex] = useState(0);
  const tab = TAB_ORDER[tabIndex];
  // SSR-safe init (no localStorage). Client effect below restores the stored
  // day when today is outside the trip.
  const [itineraryDay, setItineraryDay] = useState(
    () => dayNumberForDate(new Date()) ?? 1
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ x: 0, width: INDICATOR_WIDTH });
  const [motionReady, setMotionReady] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  /** Fractional tab progress for the bottom indicator while dragging. */
  const [tabProgress, setTabProgress] = useState(0);

  const tabIndexRef = useRef(tabIndex);
  tabIndexRef.current = tabIndex;
  const pageWidthRef = useRef(pageWidth);
  pageWidthRef.current = pageWidth;
  const dragRef = useRef(0);
  const draggingRef = useRef(false);
  const settlingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const pendingProgressRef = useRef<number | null>(null);

  const queueTabProgress = (progress: number) => {
    pendingProgressRef.current = progress;
    if (progressRafRef.current != null) return;
    progressRafRef.current = requestAnimationFrame(() => {
      progressRafRef.current = null;
      if (pendingProgressRef.current != null) {
        setTabProgress(pendingProgressRef.current);
        pendingProgressRef.current = null;
      }
    });
  };

  useEffect(() => {
    setItineraryDay(landingDayNumber());
  }, []);

  const paintTrack = useCallback((index: number, drag: number, animate: boolean) => {
    const track = trackRef.current;
    const w = pageWidthRef.current;
    if (!track || w <= 0) return;
    const x = -index * w + drag;
    track.style.transition = animate
      ? `transform ${PAGE_SETTLE_MS}ms ${PAGE_SETTLE_EASE}`
      : 'none';
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  }, []);

  // Measure pager width.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setPageWidth(w);
      pageWidthRef.current = w;
      if (!draggingRef.current && !settlingRef.current) {
        paintTrack(tabIndexRef.current, 0, false);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [demoMode, paintTrack]);

  // Keep track aligned when tab changes via the bar (not mid-drag).
  useLayoutEffect(() => {
    if (draggingRef.current || settlingRef.current) return;
    dragRef.current = 0;
    paintTrack(tabIndex, 0, motionReady);
    setTabProgress(tabIndex);
  }, [tabIndex, pageWidth, paintTrack, motionReady]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const update = () => {
      const n = TAB_ORDER.length;
      const progress = Math.max(0, Math.min(n - 1, tabProgress));
      const i0 = Math.floor(progress);
      const i1 = Math.min(n - 1, i0 + 1);
      const t = progress - i0;
      const btn0 = btnRefs.current[i0];
      const btn1 = btnRefs.current[i1];
      if (!btn0) return;
      const rowRect = row.getBoundingClientRect();
      const c0 =
        btn0.getBoundingClientRect().left -
        rowRect.left +
        btn0.getBoundingClientRect().width / 2;
      const c1 = btn1
        ? btn1.getBoundingClientRect().left -
          rowRect.left +
          btn1.getBoundingClientRect().width / 2
        : c0;
      const center = c0 + (c1 - c0) * t;
      setIndicator({
        x: center - INDICATOR_WIDTH / 2,
        width: INDICATOR_WIDTH,
      });
    };

    update();
    const raf = requestAnimationFrame(() => {
      update();
      setMotionReady(true);
    });
    const ro = new ResizeObserver(update);
    ro.observe(row);
    for (const btn of btnRefs.current) {
      if (btn) ro.observe(btn);
    }
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [tabProgress, demoMode, pageWidth]);

  const setDay = (day: number) => {
    setItineraryDay(day);
    writeStoredItineraryDay(day);
  };

  const commitIndex = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TAB_ORDER.length - 1, next));
    if (TAB_ORDER[clamped] === 'itinerary') {
      setItineraryDay((prev) => {
        const day = resolveItineraryDay(prev);
        writeStoredItineraryDay(day);
        return day;
      });
    }
    setTabIndex(clamped);
    setTabProgress(clamped);
    dragRef.current = 0;
  }, []);

  const selectTab = (key: TabKey) => {
    const idx = TAB_ORDER.indexOf(key);
    if (idx < 0 || idx === tabIndexRef.current) return;
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    settlingRef.current = false;
    draggingRef.current = false;
    setIsDragging(false);
    hapticLight();
    // Animate from current visual position to the tapped tab.
    const w = pageWidthRef.current;
    const from = tabIndexRef.current;
    if (w > 0 && from !== idx) {
      settlingRef.current = true;
      paintTrack(from, 0, false);
      requestAnimationFrame(() => {
        paintTrack(idx, 0, true);
        setTabProgress(idx);
        settleTimerRef.current = window.setTimeout(() => {
          settlingRef.current = false;
          commitIndex(idx);
          paintTrack(idx, 0, false);
          settleTimerRef.current = null;
        }, PAGE_SETTLE_MS);
      });
    } else {
      commitIndex(idx);
    }
  };

  // Interactive horizontal pager — content follows the finger, then snaps.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let axis: 'undecided' | 'x' | 'y' = 'undecided';
    let ignored = false;

    const rubberBand = (dx: number) => {
      const idx = tabIndexRef.current;
      const n = TAB_ORDER.length;
      let next = dx;
      if (idx === 0 && next > 0) next *= EDGE_RESIST;
      if (idx === n - 1 && next < 0) next *= EDGE_RESIST;
      return next;
    };

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (settlingRef.current) return;
      if (document.documentElement.classList.contains('reorder-select-lock')) {
        return;
      }
      const target = e.target as Element | null;
      ignored = Boolean(target?.closest?.('[data-swipe-ignore]'));
      if (ignored) return;

      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastT = e.timeStamp;
      velocity = 0;
      axis = 'undecided';
      draggingRef.current = false;
    };

    const onMove = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId || ignored) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = Math.max(1, e.timeStamp - lastT);
      // EMA so a single noisy sample doesn't fake a flick.
      const sample = (e.clientX - lastX) / dt;
      velocity = velocity * 0.6 + sample * 0.4;
      lastX = e.clientX;
      lastT = e.timeStamp;

      if (axis === 'undecided') {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < AXIS_LOCK_PX && absY < AXIS_LOCK_PX) return;
        axis = absX > absY * 1.15 ? 'x' : 'y';
        if (axis === 'y') return;
        draggingRef.current = true;
        setIsDragging(true);
        paintTrack(tabIndexRef.current, 0, false);
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        hapticLight();
      }

      if (axis !== 'x') return;
      e.preventDefault();
      const next = rubberBand(dx);
      dragRef.current = next;
      const idx = tabIndexRef.current;
      const w = pageWidthRef.current || 1;
      paintTrack(idx, next, false);
      queueTabProgress(idx - next / w);
    };

    const finish = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const wasDragging = draggingRef.current;
      pointerId = null;
      ignored = false;
      draggingRef.current = false;
      setIsDragging(false);

      if (!wasDragging || axis !== 'x') {
        axis = 'undecided';
        dragRef.current = 0;
        paintTrack(tabIndexRef.current, 0, false);
        setTabProgress(tabIndexRef.current);
        return;
      }
      axis = 'undecided';

      const dx = dragRef.current;
      const w = pageWidthRef.current || viewport.clientWidth || 1;
      const idx = tabIndexRef.current;
      const goNext =
        dx < 0 &&
        (Math.abs(dx) > w * COMMIT_DISTANCE || velocity < -COMMIT_VELOCITY);
      const goPrev =
        dx > 0 &&
        (Math.abs(dx) > w * COMMIT_DISTANCE || velocity > COMMIT_VELOCITY);

      let next = idx;
      if (goNext && idx < TAB_ORDER.length - 1) next = idx + 1;
      else if (goPrev && idx > 0) next = idx - 1;

      const targetDrag = (idx - next) * w;
      settlingRef.current = true;

      // Frame 1: transition off → on at current offset; frame 2: animate to snap.
      paintTrack(idx, dx, false);
      requestAnimationFrame(() => {
        paintTrack(idx, targetDrag, true);
        setTabProgress(next);
        if (next !== idx) hapticLight();

        settleTimerRef.current = window.setTimeout(() => {
          settlingRef.current = false;
          commitIndex(next);
          paintTrack(next, 0, false);
          settleTimerRef.current = null;
        }, PAGE_SETTLE_MS);
      });
    };

    const onCancel = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      pointerId = null;
      ignored = false;
      draggingRef.current = false;
      setIsDragging(false);
      axis = 'undecided';
      dragRef.current = 0;
      paintTrack(tabIndexRef.current, 0, true);
      setTabProgress(tabIndexRef.current);
    };

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove, { passive: false });
    viewport.addEventListener('pointerup', finish);
    viewport.addEventListener('pointercancel', onCancel);
    return () => {
      viewport.removeEventListener('pointerdown', onDown);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup', finish);
      viewport.removeEventListener('pointercancel', onCancel);
      if (settleTimerRef.current != null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, [commitIndex, paintTrack]);

  return (
    <div className="city-tint mx-auto flex h-[100dvh] max-w-app flex-col overflow-hidden">
      {demoMode && (
        <div className="bg-ink/90 px-4 py-1.5 text-center text-[11px] text-cream">
          Demo mode — add Supabase keys in <code>.env.local</code> for realtime group sync
        </div>
      )}

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: isDragging ? 'none' : 'pan-y' }}
      >
        <div
          ref={trackRef}
          className="flex h-full will-change-transform"
          style={{
            width: pageWidth > 0 ? pageWidth * TAB_ORDER.length : '100%',
          }}
        >
          {TAB_ORDER.map((key) => (
            <div
              key={key}
              className="no-scrollbar h-full shrink-0 overflow-y-auto pb-10"
              style={{
                width: pageWidth > 0 ? pageWidth : '100%',
                // Keep offscreen tabs from stealing scroll while idle.
                overflowY: key === tab || isDragging ? 'auto' : 'hidden',
              }}
              aria-hidden={key !== tab}
            >
              {key === 'itinerary' && (
                <ItineraryTab day={itineraryDay} onDayChange={setDay} />
              )}
              {key === 'finance' && <FinanceTab />}
              {key === 'stats' && <StatsTab />}
            </div>
          ))}
        </div>
      </div>

      {/* bottom tab bar */}
      <nav className="sticky bottom-0 z-30 border-t border-black/5 bg-cream-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div ref={rowRef} className="relative flex items-stretch justify-around px-2">
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-0.5 rounded-full will-change-transform"
            style={{
              width: indicator.width,
              background: 'var(--city-accent)',
              transform: `translate3d(${indicator.x}px, 0, 0)`,
              transition:
                motionReady && !isDragging
                  ? `transform ${MOTION.indicator} ${MOTION.indicatorEase}`
                  : 'none',
            }}
          />
          {TABS.map(({ key, label, icon: Icon }, i) => {
            const active = Math.round(tabProgress) === i;
            return (
              <button
                key={key}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                onClick={() => selectTab(key)}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors duration-300 ${
                  active ? '' : 'text-muted'
                }`}
                style={active ? { color: 'var(--city-accent)' } : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
