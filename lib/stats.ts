import type { ItineraryItem, Photo, Profile, StatCategory, StatEntry } from './types';

// The four self-input counters. Steps and photos are derived/read-only and
// handled separately in the UI.
export const COUNTER_CATEGORIES: {
  key: StatCategory;
  label: string;
  emoji: string;
}[] = [
  { key: 'poop', label: 'Poops', emoji: '💩' },
  { key: 'drink', label: 'Drinks', emoji: '🍻' },
  { key: 'mosquito', label: 'Mozzie bites', emoji: '🦟' },
  { key: 'coffee', label: 'Coffees', emoji: '☕' },
];

export const ALL_LEADERBOARD_CATEGORIES: { key: StatCategory | 'photos'; label: string; emoji: string; unit: string }[] = [
  ...COUNTER_CATEGORIES.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji, unit: '' })),
  { key: 'photos', label: 'Photos tagged in', emoji: '📸', unit: '' },
  { key: 'steps', label: 'Steps', emoji: '👟', unit: '' },
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

// Trip-wide total per person for one stat category.
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

// Photos each person is tagged in — the "photo counter" leaderboard source.
// Pass a dayNumber to restrict to one day (via the photo's parent activity).
export function photoTagCounts(
  profiles: Profile[],
  photos: Photo[],
  itinerary: ItineraryItem[],
  dayNumber?: number
): Map<string, number> {
  const dayOf = new Map(itinerary.map((i) => [i.id, i.day_number]));
  const totals = new Map<string, number>();
  for (const p of profiles) totals.set(p.id, 0);
  for (const photo of photos) {
    if (dayNumber && dayOf.get(photo.activity_id) !== dayNumber) continue;
    for (const uid of photo.tagged_user_ids ?? []) {
      if (totals.has(uid)) totals.set(uid, (totals.get(uid) ?? 0) + 1);
    }
  }
  return totals;
}
