import type { Photo, Profile, StatCategory, StatEntry } from './types';

// Stats are cumulative across the whole trip. Each person/category pair keeps
// a single row in stat_entries, stored under this fixed day_number slot.
export const STATS_DAY = 1;

// Luggage weights are stored as integer tenths of a kilogram (125 → 12.5 kg).
export const LUGGAGE_WEIGHT_SCALE = 10;

// The five self-input counters. Luggage before/after and photos-taken are
// handled separately in the UI. Icons live in StatsTab (Lucide).
export const COUNTER_CATEGORIES: {
  key: StatCategory;
  label: string;
}[] = [
  { key: 'poop', label: 'Poops' },
  { key: 'drink', label: 'Drinks' },
  { key: 'mosquito', label: 'Mozzie bites' },
  { key: 'coffee', label: 'Coffees' },
  { key: 'cards', label: 'Card games won' },
];

export const ALL_LEADERBOARD_CATEGORIES: {
  key: StatCategory | 'photos' | 'luggage_change';
  label: string;
}[] = [
  ...COUNTER_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
  { key: 'photos', label: 'Photos taken' },
  { key: 'luggage_change', label: 'Luggage change' },
];

export function weightKgFromCount(count: number): number {
  return count / LUGGAGE_WEIGHT_SCALE;
}

export function countFromWeightKg(kg: number): number {
  return Math.max(0, Math.round(kg * LUGGAGE_WEIGHT_SCALE));
}

/** Format a tenths-of-kg count as e.g. "12.5 kg". */
export function formatLuggageKg(count: number): string {
  return `${weightKgFromCount(count).toFixed(1)} kg`;
}

/** Format a signed delta in tenths-of-kg as e.g. "+1.5 kg" / "−0.5 kg". */
export function formatLuggageDelta(deltaTenths: number): string {
  const kg = weightKgFromCount(deltaTenths);
  const sign = kg > 0 ? '+' : kg < 0 ? '−' : '';
  return `${sign}${Math.abs(kg).toFixed(1)} kg`;
}

export function statFor(
  stats: StatEntry[],
  userId: string,
  dayNumber: number,
  category: StatCategory
): number {
  return (
    stats.find(
      (s) => s.user_id === userId && s.day_number === dayNumber && s.category === category
    )?.count ?? 0
  );
}

// Trip-wide total per person for one stat category. Sums every row so counts
// logged under old per-day slots still show up.
export function statTotals(
  profiles: Profile[],
  stats: StatEntry[],
  category: StatCategory
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const p of profiles) totals.set(p.id, 0);
  for (const s of stats) {
    if (s.category !== category || !totals.has(s.user_id)) continue;
    totals.set(s.user_id, (totals.get(s.user_id) ?? 0) + s.count);
  }
  return totals;
}

// Photos each person has taken (uploaded) — the "photos" leaderboard source.
export function photoUploadCounts(
  profiles: Profile[],
  photos: Photo[]
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const p of profiles) totals.set(p.id, 0);
  for (const photo of photos) {
    const uid = photo.uploaded_by_id;
    if (uid && totals.has(uid)) totals.set(uid, (totals.get(uid) ?? 0) + 1);
  }
  return totals;
}

/**
 * After − before luggage weight in tenths of a kg.
 * Missing when either check-in weight has not been logged yet.
 */
export function luggageChangeTenths(
  profiles: Profile[],
  stats: StatEntry[]
): Map<string, number | null> {
  const deltas = new Map<string, number | null>();
  for (const p of profiles) {
    const before = statFor(stats, p.id, STATS_DAY, 'luggage_before');
    const after = statFor(stats, p.id, STATS_DAY, 'luggage_after');
    deltas.set(p.id, before > 0 && after > 0 ? after - before : null);
  }
  return deltas;
}
