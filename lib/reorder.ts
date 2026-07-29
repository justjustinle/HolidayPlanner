// Same-day itinerary reorder: drag between cards → derive a new start time
// (and preserved duration) from neighboring activities. Order is time — there
// is no separate sort_order column.

import { buildTimeLabel, timeToMinutes } from './time';

export const REORDER_GRID_MINUTES = 5;
export const REORDER_EDGE_PAD_MINUTES = 30;
export const REORDER_LONG_PRESS_MS = 320;
export const REORDER_MOVE_CANCEL_PX = 8;
export const REORDER_HINT_KEY = 'travel_reorder_hint_seen_v1';
export const REORDER_UNDO_MS = 5000;

export interface ReorderableActivity {
  id: string;
  time_label: string;
  end_time_label: string | null;
}

/** Clamp + snap minutes-since-midnight onto the 5-minute grid. */
export function snapMinutes(
  mins: number,
  grid: number = REORDER_GRID_MINUTES
): number {
  const max = 23 * 60 + 55;
  const clamped = Math.min(max, Math.max(0, mins));
  return Math.round(clamped / grid) * grid;
}

export function minutesToTimeLabel(mins: number): string {
  const snapped = snapMinutes(mins);
  const hour24 = Math.floor(snapped / 60);
  const minute = snapped % 60;
  return buildTimeLabel({ hour24, minute });
}

/** Duration in minutes when an end time is set and after start; else null. */
export function activityDurationMinutes(
  item: Pick<ReorderableActivity, 'time_label' | 'end_time_label'>
): number | null {
  if (!item.end_time_label) return null;
  const start = timeToMinutes(item.time_label);
  const end = timeToMinutes(item.end_time_label);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return end - start;
}

export interface ReorderTimesResult {
  time_label: string;
  end_time_label: string | null;
  /** True when the new window overlaps another activity's start or window. */
  overlaps: boolean;
}

/**
 * Compute new start/end for `dragged` when dropped at `insertIndex` among
 * `others` (sorted by start time, excluding the dragged item).
 *
 * insertIndex 0 = before first; others.length = after last.
 */
export function computeReorderTimes(
  others: ReorderableActivity[],
  insertIndex: number,
  dragged: Pick<ReorderableActivity, 'time_label' | 'end_time_label'>
): ReorderTimesResult {
  const index = Math.min(Math.max(0, insertIndex), others.length);
  let rawStart: number;

  if (others.length === 0) {
    rawStart = timeToMinutes(dragged.time_label);
  } else if (index === 0) {
    rawStart =
      timeToMinutes(others[0].time_label) - REORDER_EDGE_PAD_MINUTES;
  } else if (index >= others.length) {
    rawStart =
      timeToMinutes(others[others.length - 1].time_label) +
      REORDER_EDGE_PAD_MINUTES;
  } else {
    const prev = timeToMinutes(others[index - 1].time_label);
    const next = timeToMinutes(others[index].time_label);
    rawStart = (prev + next) / 2;
    // If neighbors are tighter than a grid step, nudge toward next without
    // landing on prev.
    if (next - prev <= REORDER_GRID_MINUTES) {
      rawStart = prev + REORDER_GRID_MINUTES;
    }
  }

  let startMins = snapMinutes(rawStart);
  // Avoid landing exactly on a neighbor start when possible.
  if (others.some((o) => timeToMinutes(o.time_label) === startMins)) {
    const bumped = snapMinutes(startMins + REORDER_GRID_MINUTES);
    if (!others.some((o) => timeToMinutes(o.time_label) === bumped)) {
      startMins = bumped;
    }
  }

  const duration = activityDurationMinutes(dragged);
  let endLabel: string | null = null;
  if (duration !== null) {
    const endMins = snapMinutes(
      Math.min(23 * 60 + 55, startMins + duration)
    );
    endLabel =
      endMins > startMins ? minutesToTimeLabel(endMins) : null;
  }

  const overlaps = activityOverlapsOthers(
    { time_label: minutesToTimeLabel(startMins), end_time_label: endLabel },
    others
  );

  return {
    time_label: minutesToTimeLabel(startMins),
    end_time_label: endLabel,
    overlaps,
  };
}

/** True if `item`'s start (or window) collides with any other activity. */
export function activityOverlapsOthers(
  item: Pick<ReorderableActivity, 'time_label' | 'end_time_label'>,
  others: ReorderableActivity[]
): boolean {
  const start = timeToMinutes(item.time_label);
  const end = item.end_time_label
    ? timeToMinutes(item.end_time_label)
    : start;

  for (const other of others) {
    const oStart = timeToMinutes(other.time_label);
    const oEnd = other.end_time_label
      ? timeToMinutes(other.end_time_label)
      : oStart;
    if (start === oStart) return true;
    // Closed-open style: touching endpoints (end === otherStart) is OK.
    if (start < oEnd && end > oStart) return true;
  }
  return false;
}

/**
 * Given pointer Y and sorted row centers (excluding the dragged row), return
 * the insert index (0…n).
 */
export function insertIndexFromY(
  clientY: number,
  rowCentersY: number[]
): number {
  if (rowCentersY.length === 0) return 0;
  for (let i = 0; i < rowCentersY.length; i++) {
    if (clientY < rowCentersY[i]) return i;
  }
  return rowCentersY.length;
}
