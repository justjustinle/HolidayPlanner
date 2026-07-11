import type { Photo, Profile, StatCategory, StatEntry } from './types';

// Stats are cumulative across the whole trip. Each person/category pair keeps
// a single row in stat_entries, stored under this fixed day_number slot.
export const STATS_DAY = 1;

// The five self-input counters. The photos-taken stat is derived/read-only
// and handled separately in the UI.
export const COUNTER_CATEGORIES: {
  key: StatCategory;
  label: string;
  emoji: string;
}[] = [
  { key: 'poop', label: 'Poops', emoji: '💩' },
  { key: 'drink', label: 'Drinks', emoji: '🍻' },
  { key: 'mosquito', label: 'Mozzie bites', emoji: '🦟' },
  { key: 'coffee', label: 'Coffees', emoji: '☕' },
  { key: 'cards', label: 'Card games won', emoji: '🃏' },
];

export const ALL_LEADERBOARD_CATEGORIES: { key: StatCategory | 'photos'; label: string; emoji: string; unit: string }[] = [
  ...COUNTER_CATEGORIES.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji, unit: '' })),
  { key: 'photos', label: 'Photos taken', emoji: '📸', unit: '' },
];

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
