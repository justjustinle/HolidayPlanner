'use client';

import {
  useEffect,
  useRef,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  REORDER_HINT_KEY,
  REORDER_LONG_PRESS_MS,
  REORDER_MOVE_CANCEL_PX,
} from '@/lib/reorder';
import { hapticLight } from '@/lib/motion';

export function readReorderHintSeen(): boolean {
  try {
    return localStorage.getItem(REORDER_HINT_KEY) === '1';
  } catch {
    return true;
  }
}

export function writeReorderHintSeen(): void {
  try {
    localStorage.setItem(REORDER_HINT_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** One-time tip under the day chrome. */
export function ReorderHint({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-black/10 bg-cream-card/80 px-3 py-2.5 text-[12px] leading-snug text-muted">
      <p className="min-w-0 flex-1">
        Hold a plan to move it on the timeline. Tap still opens photos.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="flex-none text-[11px] font-medium text-ink"
        aria-label="Dismiss tip"
      >
        Got it
      </button>
    </div>
  );
}

export type ReorderArmDetail = {
  itemId: string;
  pointerId: number;
  clientX: number;
  clientY: number;
  /** Card surface rect at arm time (for ghost sizing). */
  rect: DOMRect;
  /** Element that received the press — used for pointer capture. */
  target: HTMLElement;
};

/**
 * Long-press detector for itinerary cards. Cancels if the finger moves before
 * the hold completes; calls onArm once when drag mode should start.
 */
export function useCardLongPress({
  enabled,
  itemId,
  onArm,
  suppressedRef,
  /** When true, ignore pointerup/cancel on the card (parent owns the drag). */
  draggingRef,
}: {
  enabled: boolean;
  itemId: string;
  onArm: (detail: ReorderArmDetail) => void;
  /** When true, the next click should be ignored (post-drag). */
  suppressedRef: MutableRefObject<boolean>;
  draggingRef?: MutableRefObject<boolean>;
}) {
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null
  );
  const targetRef = useRef<HTMLElement | null>(null);
  const armedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    clearTimer();
    armedRef.current = false;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    };
    targetRef.current = e.currentTarget;
    const start = startRef.current;
    const el = e.currentTarget;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (!el || !start) return;
      armedRef.current = true;
      hapticLight();
      // Block pan/zoom on this surface for the rest of the gesture.
      el.style.touchAction = 'none';
      try {
        el.setPointerCapture(start.pointerId);
      } catch {
        /* capture can fail if the pointer already ended */
      }
      onArm({
        itemId,
        pointerId: start.pointerId,
        clientX: start.x,
        clientY: start.y,
        rect: el.getBoundingClientRect(),
        target: el,
      });
    }, REORDER_LONG_PRESS_MS);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    // After arm, parent tracks movement — don't cancel here.
    if (armedRef.current || draggingRef?.current) return;
    if (timerRef.current === null) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > REORDER_MOVE_CANCEL_PX) {
      clearTimer();
      startRef.current = null;
    }
  };

  const onPointerUpOrCancel = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    // If a drag is active, parent owns end — leave capture/touchAction alone.
    if (armedRef.current || draggingRef?.current) {
      startRef.current = null;
      return;
    }
    clearTimer();
    startRef.current = null;
    const el = targetRef.current;
    if (el) el.style.touchAction = '';
  };

  const onClickCapture = (e: ReactMouseEvent | ReactPointerEvent) => {
    if (!suppressedRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressedRef.current = false;
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerUpOrCancel,
    onPointerCancel: onPointerUpOrCancel,
    onClickCapture,
  };
}
