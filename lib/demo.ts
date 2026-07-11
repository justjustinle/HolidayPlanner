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
    time_label: '5:30 PM',
    title: 'Land BKK, taxi to hotel',
    location: 'Suvarnabhumi → Sukhumvit',
    photo_url: null,
  },
  {
    id: 'demo-i2',
    day_number: 1,
    time_label: '8:00 PM',
    title: 'Street food at Chinatown',
    location: 'Yaowarat Road',
    photo_url: null,
  },
  {
    id: 'demo-i3',
    day_number: 4,
    time_label: '1:00 PM',
    title: 'Phi Phi island boat trip',
    location: 'Rassada Pier',
    photo_url: null,
  },
  {
    id: 'demo-i4',
    day_number: 7,
    time_label: '2:00 PM',
    title: 'War Remnants Museum',
    location: 'District 3',
    photo_url: null,
  },
  {
    id: 'demo-i5',
    day_number: 11,
    time_label: '9:00 AM',
    title: 'Snorkeling trip',
    location: 'Hon Mun Island',
    photo_url: null,
  },
];

export const DEMO_PHOTOS: Photo[] = [];

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
  { id: 'demo-st5', user_id: 'demo-alex', day_number: 1, category: 'steps', count: 14200 },
  { id: 'demo-st6', user_id: 'demo-jo', day_number: 1, category: 'steps', count: 11890 },
];
