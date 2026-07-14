// Static trip context. Days are fixed; itinerary *cards* within each day are
// stored in the database so the group can collaboratively add/photograph them.

export interface TripDay {
  dayNumber: number;
  destination: string;
  label: string; // e.g. "Day 1"
  dateLabel: string; // e.g. "Fri 28th Aug" (weekdays match 2026)
  accentHex: string;
}

// Bangkok 28 Aug (5pm) → 31 Aug (3 nights)
// Phuket 31 Aug → 3 Sep (3 nights)
// Saigon 3 Sep → 7 Sep
// Nha Trang 7 Sep → 10 Sep
// Weekdays verified against the 2026 calendar (28 Aug 2026 = Friday).
export const TRIP_DAYS: TripDay[] = [
  { dayNumber: 1, destination: 'Bangkok', label: 'Day 1', dateLabel: 'Fri 28th Aug', accentHex: '#c9992e' },
  { dayNumber: 2, destination: 'Bangkok', label: 'Day 2', dateLabel: 'Sat 29th Aug', accentHex: '#c9992e' },
  { dayNumber: 3, destination: 'Bangkok', label: 'Day 3', dateLabel: 'Sun 30th Aug', accentHex: '#c9992e' },
  { dayNumber: 4, destination: 'Phuket', label: 'Day 4', dateLabel: 'Mon 31st Aug', accentHex: '#2f97a6' },
  { dayNumber: 5, destination: 'Phuket', label: 'Day 5', dateLabel: 'Tue 1st Sep', accentHex: '#2f97a6' },
  { dayNumber: 6, destination: 'Phuket', label: 'Day 6', dateLabel: 'Wed 2nd Sep', accentHex: '#2f97a6' },
  { dayNumber: 7, destination: 'Saigon', label: 'Day 7', dateLabel: 'Thu 3rd Sep', accentHex: '#b0472f' },
  { dayNumber: 8, destination: 'Saigon', label: 'Day 8', dateLabel: 'Fri 4th Sep', accentHex: '#b0472f' },
  { dayNumber: 9, destination: 'Saigon', label: 'Day 9', dateLabel: 'Sat 5th Sep', accentHex: '#b0472f' },
  { dayNumber: 10, destination: 'Saigon', label: 'Day 10', dateLabel: 'Sun 6th Sep', accentHex: '#b0472f' },
  { dayNumber: 11, destination: 'Nha Trang', label: 'Day 11', dateLabel: 'Mon 7th Sep', accentHex: '#3f9b8a' },
  { dayNumber: 12, destination: 'Nha Trang', label: 'Day 12', dateLabel: 'Tue 8th Sep', accentHex: '#3f9b8a' },
  { dayNumber: 13, destination: 'Nha Trang', label: 'Day 13', dateLabel: 'Wed 9th Sep', accentHex: '#3f9b8a' },
];

export function dayByNumber(n: number): TripDay | undefined {
  return TRIP_DAYS.find((d) => d.dayNumber === n);
}

/** Display name for the trip identity header. */
export const TRIP_TITLE = 'Thailand & Vietnam';

/** Compact range for the header meta line, e.g. "28th Aug – 9th Sep". */
export function tripDateRangeLabel(): string {
  const first = TRIP_DAYS[0]?.dateLabel ?? '';
  const last = TRIP_DAYS[TRIP_DAYS.length - 1]?.dateLabel ?? '';
  const compact = (label: string) =>
    label.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/i, '');
  return `${compact(first)} – ${compact(last)}`;
}

export function dayNumberForDate(date: Date): number | null {
  // Compare local calendar days (device timezone), not raw ms — avoids DST
  // off-by-ones around midnight.
  const start = new Date(2026, 7, 28); // 28 Aug 2026 local
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff =
    Math.round((day.getTime() - start.getTime()) / 86_400_000) + 1;
  return diff >= 1 && diff <= TRIP_DAYS.length ? diff : null;
}

// Today's trip day, clamped into the trip range so pickers always land somewhere.
// Used for expense defaults etc. After the trip ends, lands on the last day.
export function defaultDayNumber(): number {
  const now = new Date();
  const exact = dayNumberForDate(now);
  if (exact) return exact;
  return now.getTime() < new Date(2026, 7, 28).getTime() ? 1 : TRIP_DAYS.length;
}

// Itinerary tab landing / tab-return: device-local today if it matches a trip
// day, else Day 1 (AppShell keeps the last selected day across tab switches
// when today is outside the trip).
export function landingDayNumber(now: Date = new Date()): number {
  return dayNumberForDate(now) ?? 1;
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  VND: '₫',
  THB: '฿',
  GBP: '£',
};
