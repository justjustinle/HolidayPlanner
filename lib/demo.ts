import type {
  ChecklistItem,
  Expense,
  ExpenseSplit,
  ItineraryItem,
  Profile,
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

// One sample expense so the settlement ledger has something to show:
// Alex paid ฿1,000 for street food, split across Alex, Sam, Jo, Priya.
export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'demo-e1',
    activity_id: 'demo-i2',
    local_amount: 1000,
    local_currency: 'THB',
    base_amount_gbp: 22.42, // 1000 / 44.6
    paid_by_id: 'demo-alex',
  },
];

export const DEMO_SPLITS: ExpenseSplit[] = [
  { id: 'demo-s1', expense_id: 'demo-e1', user_id: 'demo-alex', amount_owed: 5.6 },
  { id: 'demo-s2', expense_id: 'demo-e1', user_id: 'demo-sam', amount_owed: 5.6 },
  { id: 'demo-s3', expense_id: 'demo-e1', user_id: 'demo-jo', amount_owed: 5.6 },
  { id: 'demo-s4', expense_id: 'demo-e1', user_id: 'demo-priya', amount_owed: 5.62 },
];

export const DEMO_CHECKLIST: ChecklistItem[] = [
  { id: 'demo-c1', label: 'Passport + visa printout', scope: 'group', owner_id: null, checked: true },
  { id: 'demo-c2', label: 'Universal power adapter', scope: 'group', owner_id: null, checked: false },
  { id: 'demo-c3', label: 'Mosquito repellent (DEET)', scope: 'group', owner_id: null, checked: false },
  { id: 'demo-c4', label: 'First-aid + Imodium kit', scope: 'group', owner_id: null, checked: false },
  { id: 'demo-c5', label: 'Sunscreen SPF50', scope: 'individual', owner_id: null, checked: false },
  { id: 'demo-c6', label: 'Swimwear + quick-dry towel', scope: 'individual', owner_id: null, checked: false },
  { id: 'demo-c7', label: 'Reef-safe flip flops', scope: 'individual', owner_id: null, checked: false },
];
