import type {
  Expense,
  ExpenseSplit,
  ItineraryItem,
  Photo,
  Profile,
  Receipt,
  ReceiptItem,
  StatEntry,
  TripSettings,
} from './types';

// Seed content used in local demo mode (no Supabase configured) so the app is
// immediately explorable. In real Supabase mode this is all read from the DB.

export const DEMO_SETTINGS: TripSettings = {
  id: 1,
  vnd_per_gbp: 35200.0,
  thb_per_gbp: 44.6,
};

export const DEMO_PROFILES: Profile[] = [
  { id: 'demo-alex', name: 'Alex' },
  { id: 'demo-sam', name: 'Sam' },
  { id: 'demo-jo', name: 'Jo' },
  { id: 'demo-priya', name: 'Priya' },
  { id: 'demo-tom', name: 'Tom' },
];

export const DEMO_ITINERARY: ItineraryItem[] = [
  {
    id: 'demo-i1',
    day_number: 1,
    time_label: '17:30',
    end_time_label: '18:15',
    title: 'Land BKK, taxi to hotel',
    location: 'Suvarnabhumi → Sukhumvit',
    notes: 'Grab Grab taxi; hotel under Justin',
    photo_url: null,
  },
  {
    id: 'demo-i2',
    day_number: 1,
    time_label: '20:00',
    end_time_label: null,
    title: 'Street food at Chinatown',
    location: 'Yaowarat Road',
    notes: null,
    photo_url: null,
  },
  {
    id: 'demo-i3',
    day_number: 4,
    time_label: '13:00',
    end_time_label: '17:00',
    title: 'Phi Phi island boat trip',
    location: 'Rassada Pier',
    notes: 'Bring sunscreen + waterproof pouch',
    photo_url: null,
  },
  {
    id: 'demo-i4',
    day_number: 7,
    time_label: '14:00',
    end_time_label: null,
    title: 'War Remnants Museum',
    location: 'District 3',
    notes: null,
    photo_url: null,
  },
  {
    id: 'demo-i5',
    day_number: 11,
    time_label: '09:00',
    end_time_label: null,
    title: 'Snorkeling trip',
    location: 'Hon Mun Island',
    notes: null,
    photo_url: null,
  },
];

export const DEMO_PHOTOS: Photo[] = [
  {
    id: 'demo-p1',
    activity_id: 'demo-i1',
    url:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c9992e"/><stop offset="1" stop-color="#b0472f"/></linearGradient></defs><rect width="240" height="240" fill="url(#g)"/><text x="120" y="128" text-anchor="middle" fill="#fdfbf5" font-family="Georgia,serif" font-size="28">BKK</text></svg>`
      ),
    uploaded_by_id: 'demo-alex',
    tagged_user_ids: ['demo-alex'],
  },
  {
    id: 'demo-p2',
    activity_id: 'demo-i1',
    url:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#2f97a6"/><text x="120" y="128" text-anchor="middle" fill="#fdfbf5" font-family="Georgia,serif" font-size="22">taxi</text></svg>`
      ),
    uploaded_by_id: 'demo-sam',
    tagged_user_ids: ['demo-sam', 'demo-alex'],
  },
  {
    id: 'demo-p3',
    activity_id: 'demo-i1',
    url:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#3f9b8a"/><circle cx="120" cy="110" r="48" fill="#fdfbf5" opacity=".35"/><text x="120" y="175" text-anchor="middle" fill="#fdfbf5" font-family="Georgia,serif" font-size="20">hotel</text></svg>`
      ),
    uploaded_by_id: 'demo-jo',
    tagged_user_ids: ['demo-jo'],
  },
];

// One manual expense: Alex paid ฿1,000 for street food, split four ways.
export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'demo-e1',
    activity_id: null,
    label: 'Street food dinner',
    day_number: 1,
    kind: 'manual',
    local_amount: 1000,
    local_currency: 'THB',
    base_amount_gbp: 22.42, // 1000 / 44.6
    paid_by_id: 'demo-alex',
  },
  // One scanned receipt: Sam paid ฿560 at a food court; items self-claimable.
  {
    id: 'demo-e2',
    activity_id: null,
    label: 'Chatuchak food court',
    day_number: 2,
    kind: 'receipt',
    local_amount: 560,
    local_currency: 'THB',
    base_amount_gbp: 12.56, // 560 / 44.6
    paid_by_id: 'demo-sam',
  },
];

export const DEMO_SPLITS: ExpenseSplit[] = [
  { id: 'demo-s1', expense_id: 'demo-e1', user_id: 'demo-alex', amount_owed: 5.6 },
  { id: 'demo-s2', expense_id: 'demo-e1', user_id: 'demo-sam', amount_owed: 5.6 },
  { id: 'demo-s3', expense_id: 'demo-e1', user_id: 'demo-jo', amount_owed: 5.6 },
  { id: 'demo-s4', expense_id: 'demo-e1', user_id: 'demo-priya', amount_owed: 5.62 },
];

export const DEMO_RECEIPTS: Receipt[] = [
  { id: 'demo-r1', expense_id: 'demo-e2', merchant: 'Chatuchak food court', image_url: null },
];

export const DEMO_RECEIPT_ITEMS: ReceiptItem[] = [
  { id: 'demo-ri1', receipt_id: 'demo-r1', name: 'Pad thai', quantity: 2, local_amount: 240, claimed_by_id: 'demo-sam' },
  { id: 'demo-ri2', receipt_id: 'demo-r1', name: 'Mango sticky rice', quantity: 1, local_amount: 120, claimed_by_id: null },
  { id: 'demo-ri3', receipt_id: 'demo-r1', name: 'Coconut shakes', quantity: 2, local_amount: 200, claimed_by_id: null },
];

export const DEMO_STATS: StatEntry[] = [
  { id: 'demo-st1', user_id: 'demo-alex', day_number: 1, category: 'drink', count: 3 },
  { id: 'demo-st2', user_id: 'demo-sam', day_number: 1, category: 'drink', count: 5 },
  { id: 'demo-st3', user_id: 'demo-sam', day_number: 1, category: 'mosquito', count: 2 },
  { id: 'demo-st4', user_id: 'demo-jo', day_number: 1, category: 'coffee', count: 4 },
  { id: 'demo-st5', user_id: 'demo-alex', day_number: 1, category: 'cards', count: 2 },
  { id: 'demo-st6', user_id: 'demo-jo', day_number: 1, category: 'cards', count: 1 },
];
