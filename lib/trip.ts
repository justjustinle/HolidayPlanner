// Static trip context. Days are fixed; itinerary *cards* within each day are
// stored in the database so the group can collaboratively add/photograph them.

export interface TripDay {
  dayNumber: number;
  destination: string;
  label: string; // e.g. "Day 1"
  dateLabel: string; // e.g. "Thu 28th Aug"
  accent: string; // tailwind color token name
  accentHex: string;
}

// Bangkok 28 Aug (5pm) → 31 Aug (3 nights)
// Phuket 31 Aug → 3 Sep (3 nights)
// Saigon 3 Sep → 7 Sep
// Nha Trang 7 Sep → 10 Sep
export const TRIP_DAYS: TripDay[] = [
  { dayNumber: 1, destination: 'Bangkok', label: 'Day 1', dateLabel: 'Thu 28th Aug', accent: 'bangkok', accentHex: '#c9992e' },
  { dayNumber: 2, destination: 'Bangkok', label: 'Day 2', dateLabel: 'Fri 29th Aug', accent: 'bangkok', accentHex: '#c9992e' },
  { dayNumber: 3, destination: 'Bangkok', label: 'Day 3', dateLabel: 'Sat 30th Aug', accent: 'bangkok', accentHex: '#c9992e' },
  { dayNumber: 4, destination: 'Phuket', label: 'Day 4', dateLabel: 'Sun 31st Aug', accent: 'phuket', accentHex: '#2f97a6' },
  { dayNumber: 5, destination: 'Phuket', label: 'Day 5', dateLabel: 'Mon 1st Sep', accent: 'phuket', accentHex: '#2f97a6' },
  { dayNumber: 6, destination: 'Phuket', label: 'Day 6', dateLabel: 'Tue 2nd Sep', accent: 'phuket', accentHex: '#2f97a6' },
  { dayNumber: 7, destination: 'Saigon', label: 'Day 7', dateLabel: 'Wed 3rd Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 8, destination: 'Saigon', label: 'Day 8', dateLabel: 'Thu 4th Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 9, destination: 'Saigon', label: 'Day 9', dateLabel: 'Fri 5th Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 10, destination: 'Saigon', label: 'Day 10', dateLabel: 'Sat 6th Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 11, destination: 'Nha Trang', label: 'Day 11', dateLabel: 'Sun 7th Sep', accent: 'nhatrang', accentHex: '#3f9b8a' },
  { dayNumber: 12, destination: 'Nha Trang', label: 'Day 12', dateLabel: 'Mon 8th Sep', accent: 'nhatrang', accentHex: '#3f9b8a' },
  { dayNumber: 13, destination: 'Nha Trang', label: 'Day 13', dateLabel: 'Tue 9th Sep', accent: 'nhatrang', accentHex: '#3f9b8a' },
];

export function dayByNumber(n: number): TripDay | undefined {
  return TRIP_DAYS.find((d) => d.dayNumber === n);
}

// Day 1 = 28 Aug 2026. Used to map real dates (e.g. Apple Health step pushes)
// onto trip day numbers and to preselect "today" in day pickers.
export const TRIP_START_ISO = '2026-08-28';

export function dayNumberForDate(date: Date): number | null {
  const start = new Date(`${TRIP_START_ISO}T00:00:00`);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1;
  return diff >= 1 && diff <= TRIP_DAYS.length ? diff : null;
}

// Today's trip day, clamped into the trip range so pickers always land somewhere.
export function defaultDayNumber(): number {
  const now = new Date();
  const exact = dayNumberForDate(now);
  if (exact) return exact;
  return now.getTime() < new Date(`${TRIP_START_ISO}T00:00:00`).getTime()
    ? 1
    : TRIP_DAYS.length;
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  VND: '₫',
  THB: '฿',
  GBP: '£',
};
