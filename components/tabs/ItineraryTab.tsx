'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import ItineraryCard, { ItineraryDragGhost } from '../itinerary/ItineraryCard';
import NowMarker from '../itinerary/NowMarker';
import AddCardSheet from '../itinerary/AddCardSheet';
import ReorderToast from '../itinerary/ReorderToast';
import {
  ReorderHint,
  readReorderHintSeen,
  writeReorderHintSeen,
  unlockNativeSelection,
  type ReorderArmDetail,
} from '../itinerary/reorderGestures';
import TabHeader from '../ui/TabHeader';
import DayPicker from '../ui/DayPicker';
import { dayByNumber, dayNumberForDateInTrip } from '@/lib/trip';
import { YARN_DEFAULT_ACCENT, setYarnFavicon } from '@/lib/brand/setYarnFavicon';
import {
  computeReorderTimes,
  insertIndexFromY,
  REORDER_UNDO_MS,
  type ReorderTimesResult,
} from '@/lib/reorder';
import { formatTimeLabel, nowToMinutes, timelineGapPx, timeToMinutes } from '@/lib/time';
import { hapticLight } from '@/lib/motion';
import type { ItineraryItem } from '@/lib/types';
import { TIMELINE_TIME_COL_PX, TIMELINE_TIME_TO_NODE_GAP_PX } from '../itinerary/YarnTimelineRail';

type TimelineRow =
  | { kind: 'now' }
  | { kind: 'item'; item: ItineraryItem; past: boolean };

type DragState = {
  itemId: string;
  pointerId: number;
  /** Offset from card top to the initial press Y. */
  grabOffsetY: number;
  clientY: number;
  left: number;
  width: number;
  height: number;
  insertIndex: number;
  preview: ReorderTimesResult;
};

type UndoState = {
  itemId: string;
  previous: Omit<ItineraryItem, 'id' | 'photo_url' | 'created_at'>;
  nextTimeLabel: string;
  overlaps: boolean;
};

function rowStartLabel(row: TimelineRow, now: Date): string {
  if (row.kind === 'now') {
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return row.item.time_label;
}

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = window.getComputedStyle(node);
    if (
      /(auto|scroll)/.test(style.overflowY) &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export default function ItineraryTab({
  day,
  onDayChange,
}: {
  /** Selected trip day — owned by AppShell so it survives tab switches. */
  day: number;
  onDayChange: (day: number) => void;
}) {
  const { itinerary, trip, tripDays, updateItineraryItem } = useTripData();
  const [adding, setAdding] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const nowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const didScrollToNow = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const undoTimerRef = useRef<number | null>(null);
  const scrollLockRef = useRef<{ el: HTMLElement; overflow: string } | null>(
    null
  );
  const dragTargetRef = useRef<HTMLElement | null>(null);
  const dragListenersRef = useRef<(() => void) | null>(null);
  const movedDuringDragRef = useRef(false);
  const armOriginYRef = useRef(0);

  const selected = dayByNumber(day, tripDays);
  const todayDay = dayNumberForDateInTrip(now, trip.start_date, tripDays.length);
  const isToday = todayDay !== null && day === todayDay;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--city-accent',
      selected?.accentHex ?? YARN_DEFAULT_ACCENT
    );
  }, [selected?.accentHex]);

  const accent = selected?.accentHex ?? YARN_DEFAULT_ACCENT;

  useEffect(() => {
    setYarnFavicon(accent);
    return () => setYarnFavicon(YARN_DEFAULT_ACCENT);
  }, [accent]);

  useEffect(() => {
    setHintVisible(!readReorderHintSeen());
  }, []);

  const items = useMemo(
    () =>
      itinerary
        .filter((i) => i.day_number === day)
        .sort((a, b) => timeToMinutes(a.time_label) - timeToMinutes(b.time_label)),
    [itinerary, day]
  );

  const reorderEnabled = items.length > 1 && !adding;

  const rows: TimelineRow[] = useMemo(() => {
    if (!isToday) {
      return items.map((item) => ({ kind: 'item' as const, item, past: false }));
    }
    const nowMins = nowToMinutes(now);
    const out: TimelineRow[] = [];
    let inserted = false;
    for (const item of items) {
      const t = timeToMinutes(item.time_label);
      if (!inserted && nowMins < t) {
        out.push({ kind: 'now' });
        inserted = true;
      }
      out.push({ kind: 'item', item, past: t < nowMins });
    }
    if (!inserted) out.push({ kind: 'now' });
    return out;
  }, [items, isToday, now]);

  useEffect(() => {
    if (!isToday) {
      didScrollToNow.current = false;
      return;
    }
    if (didScrollToNow.current || drag) return;
    const el = nowRef.current;
    if (!el) return;
    didScrollToNow.current = true;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [isToday, rows, drag]);

  const clearUndoTimer = () => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const dismissHint = useCallback(() => {
    writeReorderHintSeen();
    setHintVisible(false);
  }, []);

  const unlockScroll = useCallback(() => {
    const locked = scrollLockRef.current;
    if (!locked) return;
    locked.el.style.overflowY = locked.overflow;
    scrollLockRef.current = null;
  }, []);

  const measureInsert = useCallback(
    (clientY: number, draggedId: string): { insertIndex: number; preview: ReorderTimesResult } => {
      const others = items.filter((i) => i.id !== draggedId);
      const centers: number[] = [];
      for (const other of others) {
        const el = listRef.current?.querySelector(
          `[data-activity-row="${other.id}"]`
        ) as HTMLElement | null;
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        centers.push(rect.top + rect.height / 2);
      }
      const insertIndex = insertIndexFromY(clientY, centers);
      const dragged = items.find((i) => i.id === draggedId);
      const preview = computeReorderTimes(
        others,
        insertIndex,
        dragged ?? { time_label: '09:00', end_time_label: null }
      );
      return { insertIndex, preview };
    },
    [items]
  );

  const autoScroll = useCallback((clientY: number) => {
    const scroller =
      scrollLockRef.current?.el ?? getScrollParent(listRef.current);
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const edge = 56;
    const maxStep = 18;
    if (clientY < rect.top + edge) {
      const t = (rect.top + edge - clientY) / edge;
      scroller.scrollTop -= Math.ceil(maxStep * Math.min(1, t));
    } else if (clientY > rect.bottom - edge) {
      const t = (clientY - (rect.bottom - edge)) / edge;
      scroller.scrollTop += Math.ceil(maxStep * Math.min(1, t));
    }
  }, []);

  const detachDragListeners = useCallback(() => {
    dragListenersRef.current?.();
    dragListenersRef.current = null;
    const target = dragTargetRef.current;
    if (target) {
      target.style.touchAction = '';
      dragTargetRef.current = null;
    }
  }, []);

  const finishDrag = useCallback(
    async (state: DragState | null, commit: boolean) => {
      detachDragListeners();
      dragRef.current = null;
      setDrag(null);
      unlockScroll();
      unlockNativeSelection();
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.documentElement.style.touchAction = '';
      document.documentElement.style.userSelect = '';

      if (!commit || !state) return;
      // Ignore accidental "drops" with no real movement (common after iOS cancel).
      if (!movedDuringDragRef.current) return;

      const item = items.find((i) => i.id === state.itemId);
      if (!item) return;

      const next = state.preview;
      if (
        next.time_label === item.time_label &&
        next.end_time_label === item.end_time_label
      ) {
        return;
      }

      const previous = {
        day_number: item.day_number,
        time_label: item.time_label,
        end_time_label: item.end_time_label,
        title: item.title,
        location: item.location,
        notes: item.notes,
      };

      await updateItineraryItem(item.id, {
        ...previous,
        time_label: next.time_label,
        end_time_label: next.end_time_label,
      });

      hapticLight();
      dismissHint();
      clearUndoTimer();
      setUndo({
        itemId: item.id,
        previous,
        nextTimeLabel: next.time_label,
        overlaps: next.overlaps,
      });
      undoTimerRef.current = window.setTimeout(() => {
        setUndo(null);
        undoTimerRef.current = null;
      }, REORDER_UNDO_MS);
    },
    [detachDragListeners, dismissHint, items, unlockScroll, updateItineraryItem]
  );

  const applyDragY = useCallback(
    (clientY: number) => {
      const current = dragRef.current;
      if (!current) return;
      if (Math.abs(clientY - armOriginYRef.current) > 6) {
        movedDuringDragRef.current = true;
      }
      autoScroll(clientY);
      const measured = measureInsert(clientY, current.itemId);
      const next: DragState = {
        ...current,
        clientY,
        insertIndex: measured.insertIndex,
        preview: measured.preview,
      };
      dragRef.current = next;
      setDrag(next);
    },
    [autoScroll, measureInsert]
  );

  const onReorderArm = useCallback(
    (detail: ReorderArmDetail) => {
      if (!reorderEnabled) return;
      // Replace any prior session.
      detachDragListeners();

      const measured = measureInsert(detail.clientY, detail.itemId);
      const next: DragState = {
        itemId: detail.itemId,
        pointerId: detail.pointerId,
        grabOffsetY: detail.clientY - detail.rect.top,
        clientY: detail.clientY,
        left: detail.rect.left,
        width: detail.rect.width,
        height: detail.rect.height,
        insertIndex: measured.insertIndex,
        preview: measured.preview,
      };
      dragRef.current = next;
      movedDuringDragRef.current = false;
      armOriginYRef.current = detail.clientY;
      dragTargetRef.current = detail.target;
      setDrag(next);

      const scroller = getScrollParent(listRef.current);
      if (scroller) {
        scrollLockRef.current = {
          el: scroller,
          overflow: scroller.style.overflowY,
        };
        scroller.style.overflowY = 'hidden';
      }
      document.body.style.touchAction = 'none';
      document.documentElement.style.touchAction = 'none';
      document.body.style.userSelect = 'none';
      document.documentElement.style.userSelect = 'none';
      document.documentElement.classList.add('reorder-select-lock');

      const onPointerMove = (e: PointerEvent) => {
        const current = dragRef.current;
        if (!current) return;
        // After iOS pointercancel, pointerId may no longer match — still track
        // if this is the active drag session.
        if (
          e.pointerId !== current.pointerId &&
          e.pointerType !== 'touch'
        ) {
          return;
        }
        e.preventDefault();
        applyDragY(e.clientY);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!dragRef.current) return;
        // Critical on iOS: block scroll takeover and keep driving the ghost.
        e.preventDefault();
        const t = e.touches[0];
        if (t) applyDragY(t.clientY);
      };

      const endWithCommit = () => {
        const current = dragRef.current;
        if (!current) return;
        void finishDrag(current, true);
      };

      const onPointerUp = (e: PointerEvent) => {
        const current = dragRef.current;
        if (!current) return;
        if (
          e.pointerId !== current.pointerId &&
          e.pointerType !== 'touch'
        ) {
          return;
        }
        endWithCommit();
      };

      // iOS often fires pointercancel when it would scroll. Do NOT commit —
      // touchmove/touchend continue the gesture after we preventDefault.
      const onPointerCancel = () => {
        /* keep session alive for touch events */
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (!dragRef.current) return;
        if (e.touches.length > 0) return;
        endWithCommit();
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') void finishDrag(dragRef.current, false);
      };

      // Attach synchronously (don't wait for React useEffect) so the first
      // finger move after long-press is captured.
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
      window.addEventListener('touchmove', onTouchMove, {
        passive: false,
        capture: true,
      });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
      window.addEventListener('keydown', onKey);

      dragListenersRef.current = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        window.removeEventListener('touchmove', onTouchMove, true);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
        window.removeEventListener('keydown', onKey);
      };
    },
    [
      applyDragY,
      detachDragListeners,
      finishDrag,
      measureInsert,
      reorderEnabled,
    ]
  );

  useEffect(
    () => () => {
      clearUndoTimer();
      detachDragListeners();
      unlockScroll();
    },
    [detachDragListeners, unlockScroll]
  );

  const handleUndo = async () => {
    if (!undo) return;
    clearUndoTimer();
    const snapshot = undo;
    setUndo(null);
    await updateItineraryItem(snapshot.itemId, snapshot.previous);
    hapticLight();
  };

  const draggedItem = drag
    ? items.find((i) => i.id === drag.itemId) ?? null
    : null;

  const othersForLine = drag
    ? items.filter((i) => i.id !== drag.itemId)
    : [];
  const lineBeforeId =
    drag && drag.insertIndex < othersForLine.length
      ? othersForLine[drag.insertIndex].id
      : null;
  const lineAfterLast =
    Boolean(drag) && drag!.insertIndex >= othersForLine.length;

  const showEmpty = items.length === 0 && !isToday;

  return (
    <div>
      <TabHeader />

      <div className="px-5">
        <DayPicker value={day} onChange={onDayChange} days={tripDays} />

        {selected && (
          <div className="mb-3 mt-5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <span
                className="mt-2 inline-block h-2 w-2 flex-none rounded-full"
                style={{ background: selected.accentHex }}
              />
              <div className="min-w-0">
                <h2 className="font-serif text-[18px] leading-tight text-ink">
                  {selected.destination}
                </h2>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">
                  {selected.label} · {selected.dateLabel}
                  {isToday && (
                    <span className="ml-1 font-medium text-ink">· Today</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdding(true)}
              aria-label="Add activity"
              className="flex h-8 flex-none items-center gap-1 rounded-full pl-2.5 pr-3 text-[13px] font-medium text-cream-card"
              style={{ background: selected.accentHex }}
            >
              <Plus size={15} />
              Add activity
            </button>
          </div>
        )}

        <ReorderHint
          visible={hintVisible && reorderEnabled}
          onDismiss={dismissHint}
        />

        {showEmpty ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-muted">
            Nothing planned for {selected?.label ?? 'this day'} yet. Tap + to add an activity.
          </div>
        ) : (
          <div ref={listRef} className="pb-24 pt-1">
            {rows.map((row, i) => {
              const isLast = i === rows.length - 1;
              const next = rows[i + 1];
              const spacingAfter = isLast
                ? 8
                : timelineGapPx(
                    rowStartLabel(row, now),
                    next ? rowStartLabel(next, now) : null
                  );
              if (row.kind === 'now') {
                return (
                  <NowMarker
                    key="now"
                    ref={nowRef}
                    now={now}
                    accentHex={accent}
                    isLast={isLast}
                    spacingAfter={spacingAfter}
                  />
                );
              }

              const showLineBefore =
                lineBeforeId !== null && lineBeforeId === row.item.id;

              return (
                <div key={row.item.id} className="relative">
                  {showLineBefore && (
                    <InsertionLine accentHex={accent} />
                  )}
                  <ItineraryCard
                    item={row.item}
                    accentHex={accent}
                    isLast={isLast && !lineAfterLast}
                    dimmed={row.past}
                    spacingAfter={spacingAfter}
                    reorderEnabled={reorderEnabled}
                    isDragSource={drag?.itemId === row.item.id}
                    onReorderArm={onReorderArm}
                  />
                </div>
              );
            })}
            {lineAfterLast && <InsertionLine accentHex={accent} />}
            {items.length === 0 && isToday && (
              <div className="mt-2 rounded-2xl border-2 border-dashed border-black/10 p-6 text-center text-[13px] text-muted">
                Nothing planned for today yet. Tap + to add an activity.
              </div>
            )}
          </div>
        )}
      </div>

      {adding && (
        <AddCardSheet day={day} onClose={() => setAdding(false)} />
      )}

      {drag && (
        <div
          className="fixed inset-0 z-40"
          style={{ touchAction: 'none' }}
          aria-hidden
        />
      )}

      {drag && draggedItem && (
        <ItineraryDragGhost
          item={draggedItem}
          accentHex={accent}
          timeLabel={drag.preview.time_label}
          endTimeLabel={drag.preview.end_time_label}
          left={drag.left}
          width={drag.width}
          top={drag.clientY - drag.grabOffsetY}
        />
      )}

      {undo && (
        <ReorderToast
          message={`Moved to ${formatTimeLabel(undo.nextTimeLabel)}`}
          detail={
            undo.overlaps ? 'Overlaps another activity on this day' : null
          }
          onUndo={() => void handleUndo()}
          onDismiss={() => {
            clearUndoTimer();
            setUndo(null);
          }}
        />
      )}
    </div>
  );
}

function InsertionLine({ accentHex }: { accentHex: string }) {
  return (
    <div
      className="relative z-10 my-0.5 flex items-center"
      style={{ gap: TIMELINE_TIME_TO_NODE_GAP_PX }}
      aria-hidden
    >
      <div className="flex-none" style={{ width: TIMELINE_TIME_COL_PX }} />
      <div
        className="h-0.5 min-w-0 flex-1 rounded-full"
        style={{ background: accentHex }}
      />
    </div>
  );
}
