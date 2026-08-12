import type {
  Expense,
  ExpenseSplit,
  ItineraryItem,
  Photo,
  Profile,
  Receipt,
  ReceiptItem,
  Trip,
  TripCurrency,
} from './types';
import type { TripDay } from './trip';
import { rangeLabelFromDays } from './trip';
import { uniqueCountriesFromTripDays } from './countries';
import { formatBaseCurrency, round2 } from './currency';
import { computeIncurredByUser, isUpcomingPending, totalSpend } from './settle';
import { parseTimeLabel } from './time';
import { photoUploadCounts } from './stats';

// Assembles a read-only "Trip Wrapped" recap from existing trip tables.
// No new data models — missing/sparse slices are omitted by the UI.

export type WrappedMember = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type WrappedStatChip = {
  label: string;
  value: string;
};

export type WrappedDayHighlight = {
  dayNumber: number;
  dayLabel: string;
  dateLabel: string;
  destination: string;
  accentHex: string;
  activityTitle: string;
  activityLocation: string | null;
  photoUrl: string;
};

export type WrappedMoneyBeat = {
  totalLabel: string;
  biggestPayer: { name: string; amountLabel: string; avatar_url: string | null } | null;
  biggestIncurred: { name: string; amountLabel: string; avatar_url: string | null } | null;
  perPerson: { name: string; amountLabel: string; avatar_url: string | null; amount: number }[];
};

export type WrappedSuperlative = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  name?: string;
  avatar_url?: string | null;
};

export type WrappedData = {
  trip: Trip;
  dateRangeLabel: string;
  countries: string[];
  destinations: string[];
  accentHex: string;
  members: WrappedMember[];
  stats: WrappedStatChip[];
  highlights: WrappedDayHighlight[];
  money: WrappedMoneyBeat | null;
  superlatives: WrappedSuperlative[];
  closingPhotoUrl: string | null;
  activityCount: number;
  photoCount: number;
};

function activeMembers(profiles: Profile[]): Profile[] {
  return profiles.filter((p) => !p.left_at);
}

function uniqueDestinations(days: TripDay[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const d of days) {
    const key = (d.city || d.destination || '').trim();
    if (!key) continue;
    const norm = key.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(key);
  }
  return out;
}

function paidTotals(
  profiles: Profile[],
  expenses: Expense[],
  now: Date = new Date()
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const p of profiles) totals.set(p.id, 0);
  for (const e of expenses) {
    if (e.kind === 'settlement') continue;
    if (isUpcomingPending(e, now)) continue;
    if (!totals.has(e.paid_by_id)) continue;
    totals.set(e.paid_by_id, round2((totals.get(e.paid_by_id) ?? 0) + e.base_amount_gbp));
  }
  return totals;
}

function topEntry(map: Map<string, number>): { id: string; value: number } | null {
  let best: { id: string; value: number } | null = null;
  for (const [id, value] of map) {
    if (value <= 0) continue;
    if (!best || value > best.value) best = { id, value };
  }
  return best;
}

function pickDayPhoto(
  dayItems: ItineraryItem[],
  photosByActivity: Map<string, Photo[]>
): { item: ItineraryItem; photo: Photo } | null {
  // Prefer the activity with the most photos; tie-break by earliest time.
  const ranked = [...dayItems].sort((a, b) => {
    const ac = photosByActivity.get(a.id)?.length ?? 0;
    const bc = photosByActivity.get(b.id)?.length ?? 0;
    if (bc !== ac) return bc - ac;
    return a.time_label.localeCompare(b.time_label);
  });
  for (const item of ranked) {
    const photos = photosByActivity.get(item.id) ?? [];
    if (photos.length) return { item, photo: photos[0] };
  }
  return null;
}

function buildHighlights(
  days: TripDay[],
  itinerary: ItineraryItem[],
  photos: Photo[]
): WrappedDayHighlight[] {
  const photosByActivity = new Map<string, Photo[]>();
  for (const photo of photos) {
    const list = photosByActivity.get(photo.activity_id) ?? [];
    list.push(photo);
    photosByActivity.set(photo.activity_id, list);
  }
  for (const [, list] of photosByActivity) {
    list.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  }

  const highlights: WrappedDayHighlight[] = [];
  for (const day of days) {
    const dayItems = itinerary.filter((i) => i.day_number === day.dayNumber);
    const pick = pickDayPhoto(dayItems, photosByActivity);
    if (!pick) continue;
    highlights.push({
      dayNumber: day.dayNumber,
      dayLabel: day.label,
      dateLabel: day.dateLabel,
      destination: day.destination,
      accentHex: day.accentHex,
      activityTitle: pick.item.title,
      activityLocation: pick.item.location,
      photoUrl: pick.photo.url,
    });
  }
  return highlights;
}

function buildMoney(
  profiles: Profile[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  receipts: Receipt[],
  receiptItems: ReceiptItem[],
  currencies: TripCurrency[],
  baseCurrency: string
): WrappedMoneyBeat | null {
  const spend = totalSpend(expenses);
  if (!(spend > 0.005)) return null;

  const paid = paidTotals(profiles, expenses);
  const incurred = computeIncurredByUser(
    profiles,
    expenses,
    splits,
    receipts,
    receiptItems
  );

  const topPaid = topEntry(paid);
  const topIncurred = topEntry(incurred);
  const profileOf = (id: string) => profiles.find((p) => p.id === id);

  const perPerson = profiles
    .map((p) => {
      const amount = round2(incurred.get(p.id) ?? 0);
      return {
        name: p.name,
        amountLabel: formatBaseCurrency(amount, baseCurrency, currencies),
        avatar_url: p.avatar_url ?? null,
        amount,
      };
    })
    .filter((row) => row.amount > 0.005)
    .sort((a, b) => b.amount - a.amount);

  return {
    totalLabel: formatBaseCurrency(spend, baseCurrency, currencies),
    biggestPayer: topPaid
      ? {
          name: profileOf(topPaid.id)?.name ?? 'Someone',
          amountLabel: formatBaseCurrency(topPaid.value, baseCurrency, currencies),
          avatar_url: profileOf(topPaid.id)?.avatar_url ?? null,
        }
      : null,
    biggestIncurred: topIncurred
      ? {
          name: profileOf(topIncurred.id)?.name ?? 'Someone',
          amountLabel: formatBaseCurrency(
            topIncurred.value,
            baseCurrency,
            currencies
          ),
          avatar_url: profileOf(topIncurred.id)?.avatar_url ?? null,
        }
      : null,
    perPerson,
  };
}

function buildSuperlatives(
  profiles: Profile[],
  itinerary: ItineraryItem[],
  photos: Photo[],
  expenses: Expense[],
  days: TripDay[]
): WrappedSuperlative[] {
  const out: WrappedSuperlative[] = [];
  const profileOf = (id: string) => profiles.find((p) => p.id === id);

  // Shutterbug — most photo uploads
  const uploads = photoUploadCounts(profiles, photos);
  const topUpload = topEntry(uploads);
  if (topUpload && topUpload.value >= 2) {
    const p = profileOf(topUpload.id);
    out.push({
      key: 'shutterbug',
      emoji: '📸',
      title: 'Shutterbug',
      subtitle: `${topUpload.value} photo${topUpload.value === 1 ? '' : 's'} uploaded`,
      name: p?.name,
      avatar_url: p?.avatar_url ?? null,
    });
  }

  // Most photographed moment — activity with the most photos
  const countByActivity = new Map<string, number>();
  for (const photo of photos) {
    countByActivity.set(
      photo.activity_id,
      (countByActivity.get(photo.activity_id) ?? 0) + 1
    );
  }
  let bestActivity: { id: string; count: number } | null = null;
  for (const [id, count] of countByActivity) {
    if (!bestActivity || count > bestActivity.count) bestActivity = { id, count };
  }
  if (bestActivity && bestActivity.count >= 2) {
    const item = itinerary.find((i) => i.id === bestActivity!.id);
    if (item) {
      const day = days.find((d) => d.dayNumber === item.day_number);
      out.push({
        key: 'most-photographed',
        emoji: '⭐',
        title: 'Most photographed moment',
        subtitle: `${item.title}${day ? ` · ${day.label}` : ''} · ${bestActivity.count} photos`,
      });
    }
  }

  // Bankroller — paid the most (group spend only)
  const paid = paidTotals(profiles, expenses);
  const topPaid = topEntry(paid);
  if (topPaid && topPaid.value > 0.005) {
    const p = profileOf(topPaid.id);
    out.push({
      key: 'bankroller',
      emoji: '💳',
      title: 'Bankroller',
      subtitle: 'Covered the most on the group tab',
      name: p?.name,
      avatar_url: p?.avatar_url ?? null,
    });
  }

  // Dawn patrol — earliest activity start on the trip
  let earliest: ItineraryItem | null = null;
  let earliestMinutes = Infinity;
  for (const item of itinerary) {
    const { hour24, minute } = parseTimeLabel(item.time_label);
    const mins = hour24 * 60 + minute;
    if (mins < earliestMinutes) {
      earliestMinutes = mins;
      earliest = item;
    }
  }
  if (earliest && earliestMinutes <= 10 * 60) {
    // Only celebrate if it was actually morning-ish (before/at 10:00)
    const day = days.find((d) => d.dayNumber === earliest!.day_number);
    const { hour24, minute } = parseTimeLabel(earliest.time_label);
    const hh = String(hour24).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    out.push({
      key: 'dawn-patrol',
      emoji: '🌅',
      title: 'Dawn patrol',
      subtitle: `${earliest.title} at ${hh}:${mm}${day ? ` · ${day.label}` : ''}`,
    });
  }

  // Night owl — latest activity start
  let latest: ItineraryItem | null = null;
  let latestMinutes = -1;
  for (const item of itinerary) {
    const { hour24, minute } = parseTimeLabel(item.time_label);
    const mins = hour24 * 60 + minute;
    if (mins > latestMinutes) {
      latestMinutes = mins;
      latest = item;
    }
  }
  if (latest && latestMinutes >= 20 * 60) {
    const day = days.find((d) => d.dayNumber === latest!.day_number);
    const { hour24, minute } = parseTimeLabel(latest.time_label);
    const hh = String(hour24).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    out.push({
      key: 'night-owl',
      emoji: '🌙',
      title: 'Night owl hour',
      subtitle: `${latest.title} at ${hh}:${mm}${day ? ` · ${day.label}` : ''}`,
    });
  }

  return out.slice(0, 5);
}

function closingPhoto(photos: Photo[], itinerary: ItineraryItem[]): string | null {
  if (!photos.length) return null;
  // Prefer a photo from the last day that has photos; else most recent upload.
  const byActivityDay = new Map<string, number>();
  for (const item of itinerary) byActivityDay.set(item.id, item.day_number);

  let best: Photo | null = null;
  let bestDay = -1;
  for (const photo of photos) {
    const day = byActivityDay.get(photo.activity_id) ?? 0;
    if (day > bestDay) {
      bestDay = day;
      best = photo;
    } else if (day === bestDay && best) {
      if ((photo.created_at ?? '') > (best.created_at ?? '')) best = photo;
    }
  }
  return best?.url ?? photos[photos.length - 1]?.url ?? null;
}

export function assembleWrapped(input: {
  trip: Trip;
  days: TripDay[];
  currencies: TripCurrency[];
  profiles: Profile[];
  itinerary: ItineraryItem[];
  photos: Photo[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  receipts: Receipt[];
  receiptItems: ReceiptItem[];
}): WrappedData {
  const members = activeMembers(input.profiles);
  const destinations = uniqueDestinations(input.days);
  const countries = uniqueCountriesFromTripDays(input.days);
  const activityCount = input.itinerary.length;
  const photoCount = input.photos.length;
  const spend = totalSpend(input.expenses);

  const stats: WrappedStatChip[] = [
    {
      label: 'Activities',
      value: String(activityCount),
    },
    {
      label: destinations.length === 1 ? 'City' : 'Cities',
      value: String(Math.max(destinations.length, 0)),
    },
  ];
  if (spend > 0.005) {
    stats.push({
      label: 'Group spend',
      value: formatBaseCurrency(spend, input.trip.base_currency, input.currencies),
    });
  }
  if (photoCount > 0) {
    stats.push({
      label: 'Photos',
      value: String(photoCount),
    });
  }

  const accentHex =
    input.days[0]?.accentHex ??
    input.days[input.days.length - 1]?.accentHex ??
    '#c9992e';

  return {
    trip: input.trip,
    dateRangeLabel: rangeLabelFromDays(input.days),
    countries,
    destinations,
    accentHex,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url ?? null,
    })),
    stats,
    highlights: buildHighlights(input.days, input.itinerary, input.photos),
    money: buildMoney(
      members,
      input.expenses,
      input.splits,
      input.receipts,
      input.receiptItems,
      input.currencies,
      input.trip.base_currency
    ),
    superlatives: buildSuperlatives(
      members,
      input.itinerary,
      input.photos,
      input.expenses,
      input.days
    ),
    closingPhotoUrl: closingPhoto(input.photos, input.itinerary),
    activityCount,
    photoCount,
  };
}
