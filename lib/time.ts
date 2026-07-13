// Time helpers for the itinerary. Canonical storage is 24-hour "HH:MM"
// (e.g. "17:30"). Legacy 12-hour labels ("5:30 PM") still parse for old rows.

export interface TimeValue {
  hour24: number; // 0–23
  minute: number; // 0–59
}

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => i); // 0..23
export const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,..,55

export function buildTimeLabel({ hour24, minute }: TimeValue): string {
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Display form — always 24h, even when the stored label is legacy 12h. */
export function formatTimeLabel(label: string | null | undefined): string {
  return buildTimeLabel(parseTimeLabel(label));
}

export function parseTimeLabel(label: string | null | undefined): TimeValue {
  const fallback: TimeValue = { hour24: 9, minute: 0 };
  if (!label) return fallback;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return fallback;
  let hour = parseInt(m[1], 10);
  let minute = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase() as 'AM' | 'PM' | undefined;
  if (ap === 'AM') {
    if (hour === 12) hour = 0;
  } else if (ap === 'PM') {
    if (hour !== 12) hour += 12;
  } else {
    // No period: treat as 24-hour (0–23). Clamp odd values.
    if (hour > 23) hour = 23;
  }
  minute = Math.min(59, Math.max(0, minute));
  hour = Math.min(23, Math.max(0, hour));
  return { hour24: hour, minute };
}

// Minutes since midnight, for ordering. Unparseable labels sort to the end.
export function timeToMinutes(label: string | null | undefined): number {
  if (!label) return Number.MAX_SAFE_INTEGER;
  const { hour24, minute } = parseTimeLabel(label);
  // Detect total parse failure: empty/garbage falls back to 09:00 — only treat
  // as unparseable when the raw string doesn't look like a time at all.
  if (!/^\d{1,2}:\d{2}/.test(label.trim())) return Number.MAX_SAFE_INTEGER;
  return hour24 * 60 + minute;
}

// Device-local minutes since midnight (for the "now" timeline marker).
export function nowToMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

// e.g. "15:42" from a Date — matches itinerary 24-hour style.
export function formatClock(now: Date = new Date()): string {
  return buildTimeLabel({
    hour24: now.getHours(),
    minute: now.getMinutes(),
  });
}

// Compact paid-on date for settle-up rows (e.g. "12/07"). Uses local calendar day.
export function formatDayMonth(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
