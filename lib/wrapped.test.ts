import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { assembleWrapped } from './wrapped';
import type {
  Expense,
  ExpenseSplit,
  ItineraryItem,
  Photo,
  Profile,
  Trip,
  TripCurrency,
} from './types';
import type { TripDay } from './trip';

const trip: Trip = {
  id: 't1',
  name: 'Thailand & Vietnam',
  start_date: '2026-08-28',
  end_date: '2026-09-09',
  base_currency: 'GBP',
};

const days: TripDay[] = [
  {
    dayNumber: 1,
    destination: 'Bangkok',
    country: 'Thailand',
    city: 'Bangkok',
    label: 'Day 1',
    dateLabel: 'Fri 28th Aug',
    accentHex: '#c9992e',
  },
  {
    dayNumber: 2,
    destination: 'Bangkok',
    country: 'Thailand',
    city: 'Bangkok',
    label: 'Day 2',
    dateLabel: 'Sat 29th Aug',
    accentHex: '#c9992e',
  },
];

const currencies: TripCurrency[] = [
  { code: 'GBP', symbol: '£', rate_per_base: 1 },
  { code: 'THB', symbol: '฿', rate_per_base: 44.6 },
];

const profiles: Profile[] = [
  { id: 'alex', name: 'Alex', avatar_url: null },
  { id: 'sam', name: 'Sam', avatar_url: null },
];

const itinerary: ItineraryItem[] = [
  {
    id: 'a1',
    day_number: 1,
    time_label: '07:30',
    end_time_label: null,
    title: 'Sunrise boat',
    location: 'Chao Phraya',
    notes: null,
    photo_url: null,
  },
  {
    id: 'a2',
    day_number: 1,
    time_label: '21:00',
    end_time_label: null,
    title: 'Night market',
    location: null,
    notes: null,
    photo_url: null,
  },
  {
    id: 'a3',
    day_number: 2,
    time_label: '12:00',
    end_time_label: null,
    title: 'Temple walk',
    location: 'Wat Arun',
    notes: null,
    photo_url: null,
  },
];

const photos: Photo[] = [
  {
    id: 'p1',
    activity_id: 'a1',
    url: 'https://example.com/1.jpg',
    uploaded_by_id: 'alex',
    tagged_user_ids: [],
    created_at: '2026-08-28T01:00:00Z',
  },
  {
    id: 'p2',
    activity_id: 'a1',
    url: 'https://example.com/2.jpg',
    uploaded_by_id: 'alex',
    tagged_user_ids: [],
    created_at: '2026-08-28T01:05:00Z',
  },
  {
    id: 'p3',
    activity_id: 'a3',
    url: 'https://example.com/3.jpg',
    uploaded_by_id: 'sam',
    tagged_user_ids: [],
    created_at: '2026-08-29T05:00:00Z',
  },
];

const expenses: Expense[] = [
  {
    id: 'e1',
    activity_id: null,
    label: 'Dinner',
    day_number: 1,
    kind: 'manual',
    local_amount: 100,
    local_currency: 'GBP',
    base_amount_gbp: 100,
    paid_by_id: 'alex',
  },
];

const splits: ExpenseSplit[] = [
  { id: 's1', expense_id: 'e1', user_id: 'alex', amount_owed: 50 },
  { id: 's2', expense_id: 'e1', user_id: 'sam', amount_owed: 50 },
];

describe('assembleWrapped', () => {
  it('builds cover stats, highlights, money, and superlatives from existing data', () => {
    const wrapped = assembleWrapped({
      trip,
      days,
      currencies,
      profiles,
      itinerary,
      photos,
      expenses,
      splits,
      receipts: [],
      receiptItems: [],
    });

    assert.equal(wrapped.trip.name, 'Thailand & Vietnam');
    assert.ok(wrapped.stats.some((s) => s.label === 'Activities' && s.value === '3'));
    assert.ok(wrapped.stats.some((s) => s.label === 'Photos' && s.value === '3'));
    assert.equal(wrapped.highlights.length, 2);
    assert.equal(wrapped.highlights[0].activityTitle, 'Sunrise boat');
    assert.ok(wrapped.money);
    assert.equal(wrapped.money!.biggestPayer?.name, 'Alex');
    assert.ok(wrapped.superlatives.some((s) => s.key === 'shutterbug'));
    assert.ok(wrapped.superlatives.some((s) => s.key === 'dawn-patrol'));
    assert.ok(wrapped.superlatives.some((s) => s.key === 'night-owl'));
    assert.ok(wrapped.closingPhotoUrl);
  });

  it('skips money and photo-heavy sections when data is sparse', () => {
    const wrapped = assembleWrapped({
      trip,
      days,
      currencies,
      profiles,
      itinerary: [itinerary[2]],
      photos: [],
      expenses: [],
      splits: [],
      receipts: [],
      receiptItems: [],
    });

    assert.equal(wrapped.money, null);
    assert.equal(wrapped.highlights.length, 0);
    assert.equal(wrapped.closingPhotoUrl, null);
    assert.ok(!wrapped.stats.some((s) => s.label === 'Photos'));
    assert.ok(!wrapped.stats.some((s) => s.label === 'Group spend'));
  });
});
