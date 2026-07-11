// Static trip context. Days are fixed; itinerary *cards* within each day are
// stored in the database so the group can collaboratively add/photograph them.

export interface TripDay {
  dayNumber: number;
  destination: string;
  label: string; // e.g. "Day 1"
  dateLabel: string; // e.g. "Thu 28 Aug"
  accent: string; // tailwind color token name
  accentHex: string;
}

// Bangkok 28 Aug (5pm) → 31 Aug (3 nights)
// Phuket 31 Aug → 3 Sep (3 nights)
// Saigon 3 Sep → 7 Sep
// Nha Trang 7 Sep → 10 Sep
export const TRIP_DAYS: TripDay[] = [
  { dayNumber: 1, destination: 'Bangkok', label: 'Day 1', dateLabel: 'Thu 28 Aug', accent: 'bangkok', accentHex: '#c9992e' },
  { dayNumber: 2, destination: 'Bangkok', label: 'Day 2', dateLabel: 'Fri 29 Aug', accent: 'bangkok', accentHex: '#c9992e' },
  { dayNumber: 3, destination: 'Bangkok', label: 'Day 3', dateLabel: 'Sat 30 Aug', accent: 'bangkok', accentHex: '#c9992e' },
  { dayNumber: 4, destination: 'Phuket', label: 'Day 4', dateLabel: 'Sun 31 Aug', accent: 'phuket', accentHex: '#2f97a6' },
  { dayNumber: 5, destination: 'Phuket', label: 'Day 5', dateLabel: 'Mon 1 Sep', accent: 'phuket', accentHex: '#2f97a6' },
  { dayNumber: 6, destination: 'Phuket', label: 'Day 6', dateLabel: 'Tue 2 Sep', accent: 'phuket', accentHex: '#2f97a6' },
  { dayNumber: 7, destination: 'Saigon', label: 'Day 7', dateLabel: 'Wed 3 Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 8, destination: 'Saigon', label: 'Day 8', dateLabel: 'Thu 4 Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 9, destination: 'Saigon', label: 'Day 9', dateLabel: 'Fri 5 Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 10, destination: 'Saigon', label: 'Day 10', dateLabel: 'Sat 6 Sep', accent: 'saigon', accentHex: '#b0472f' },
  { dayNumber: 11, destination: 'Nha Trang', label: 'Day 11', dateLabel: 'Sun 7 Sep', accent: 'nhatrang', accentHex: '#3f9b8a' },
  { dayNumber: 12, destination: 'Nha Trang', label: 'Day 12', dateLabel: 'Mon 8 Sep', accent: 'nhatrang', accentHex: '#3f9b8a' },
  { dayNumber: 13, destination: 'Nha Trang', label: 'Day 13', dateLabel: 'Tue 9 Sep', accent: 'nhatrang', accentHex: '#3f9b8a' },
];

export function dayByNumber(n: number): TripDay | undefined {
  return TRIP_DAYS.find((d) => d.dayNumber === n);
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  VND: '₫',
  THB: '฿',
  GBP: '£',
};
