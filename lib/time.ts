// Time helpers for the itinerary. Times are stored as a canonical 12-hour
// label (e.g. "8:30 AM") produced by the wheel picker, so parsing for sort is
// reliable.

export interface TimeValue {
  hour12: number; // 1–12
  minute: number; // 0–59
  period: 'AM' | 'PM';
}

export const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
export const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,..,55
export const PERIODS: Array<'AM' | 'PM'> = ['AM', 'PM'];

export function buildTimeLabel({ hour12, minute, period }: TimeValue): string {
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export function parseTimeLabel(label: string | null | undefined): TimeValue {
  const fallback: TimeValue = { hour12: 9, minute: 0, period: 'AM' };
  if (!label) return fallback;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return fallback;
  let hour12 = parseInt(m[1], 10);
  let minute = parseInt(m[2], 10);
  let period = (m[3]?.toUpperCase() as 'AM' | 'PM') ?? 'AM';
  // Normalise a 24-hour value into 12-hour + period.
  if (!m[3]) {
    if (hour12 === 0) {
      hour12 = 12;
      period = 'AM';
    } else if (hour12 === 12) {
      period = 'PM';
    } else if (hour12 > 12) {
      hour12 -= 12;
      period = 'PM';
    }
  }
  minute = Math.min(59, Math.max(0, minute));
  return { hour12, minute, period };
}

// Minutes since midnight, for ordering. Unparseable labels sort to the end.
export function timeToMinutes(label: string | null | undefined): number {
  if (!label) return Number.MAX_SAFE_INTEGER;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'AM') {
    if (h === 12) h = 0;
  } else if (ap === 'PM') {
    if (h !== 12) h += 12;
  }
  return h * 60 + min;
}

// Device-local minutes since midnight (for the "now" timeline marker).
export function nowToMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

// e.g. "3:42 PM" from a Date — matches itinerary time style.
export function formatClock(now: Date = new Date()): string {
  const minutes = now.getMinutes();
  let hour24 = now.getHours();
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
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
