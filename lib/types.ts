// Shared domain types — mirror the Supabase schema in supabase/schema.sql.

// ISO-style three-letter code. Trips choose their own currency set.
export type CurrencyCode = string;

// A person on a trip. Content rows (paid_by_id, uploaded_by_id, splits, stats,
// claims) all FK to this id. From Phase 1 it is trip-scoped; `user_id` links it
// to a signed-in account (null = an unclaimed placeholder member).
export interface Profile {
  id: string;
  name: string;
  avatar_url?: string | null;
  created_at?: string;
  trip_id?: string;
  user_id?: string | null;
  role?: 'owner' | 'member';
  left_at?: string | null;
}

export interface TripSettings {
  id: 1;
  vnd_per_gbp: number;
  thb_per_gbp: number;
  updated_at?: string;
}

// A trip's identity + span, replacing the hard-coded TRIP_TITLE / date anchors.
export interface Trip {
  id: string;
  name: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string; // 'YYYY-MM-DD'
  base_currency: string; // e.g. 'GBP'
}

// A currency available on a trip. rate_per_base = local units per 1 base unit
// (the base_currency row is 1). Replaces the hard-coded CURRENCY_SYMBOL map.
export interface TripCurrency {
  code: string;
  symbol: string;
  rate_per_base: number | null;
}

export interface CreateTripResult {
  tripId: string;
  inviteCode: string;
}

export interface InvitePreview {
  trip_id: string;
  trip_name: string;
  start_date: string;
  end_date: string;
  member_count: number;
  /** Unique destination countries in first-seen day order. */
  countries: string[];
}

export interface ItineraryItem {
  id: string;
  day_number: number;
  time_label: string; // start, 24h "HH:MM"; legacy "h:mm AM/PM" still displays
  end_time_label: string | null; // optional end, same format
  title: string;
  location: string | null;
  notes: string | null; // misc notes — booking refs, meet points, etc.
  photo_url: string | null; // legacy single-photo column, superseded by `photos`
  created_at?: string;
}

// One photo inside an activity's Polaroid carousel. Multiple per activity.
export interface Photo {
  id: string;
  activity_id: string;
  url: string;
  uploaded_by_id: string | null;
  tagged_user_ids: string[]; // people in the photo (defaults to uploader)
  created_at?: string;
}

// 'settlement' rows are peer-to-peer "Settle Up" payments: paid_by_id is the
// debtor, and a single expense_split assigns the full amount to the receiver.
// They flow through the normal balance math but are excluded from group spend
// and the expenses feed.
export type ExpenseKind = 'manual' | 'receipt' | 'settlement';

export const SETTLEMENT_LABEL = 'Settle Up Payment';

export interface Expense {
  id: string;
  activity_id: string | null; // legacy link; new expenses are standalone
  label: string | null; // e.g. "Street food dinner" or the receipt merchant
  day_number: number | null;
  kind: ExpenseKind;
  local_amount: number;
  local_currency: CurrencyCode;
  base_amount_gbp: number;
  paid_by_id: string;
  /** Optional proof-of-payment photo (manual expenses). Receipt scans use Receipt.image_url. */
  image_url?: string | null;
  /** When true, expense is deferred until payment_date (see isUpcomingPending). */
  is_upcoming?: boolean;
  /** Local calendar date `YYYY-MM-DD`; required when is_upcoming is true. */
  payment_date?: string | null;
  created_at?: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
}

// A scanned receipt attached to a `kind = 'receipt'` expense.
export interface Receipt {
  id: string;
  expense_id: string;
  merchant: string | null;
  image_url: string | null;
  created_at?: string;
}

// One line item on a receipt. Unclaimed (claimed_by_id null) until someone
// self-selects it; unclaimed lines fall back to the payer in settlement.
export interface ReceiptItem {
  id: string;
  receipt_id: string;
  name: string;
  quantity: number;
  local_amount: number; // line total in the receipt's currency
  claimed_by_id: string | null;
  created_at?: string;
}

/** Trip-scoped prep item (vaccines, passports, …) — not day/activity linked. */
export interface ChecklistItem {
  id: string;
  trip_id?: string;
  label: string;
  is_done: boolean;
  created_by_id: string | null;
  completed_by_id: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at?: string;
}

export type StatCategory =
  | 'poop'
  | 'drink'
  | 'mosquito'
  | 'coffee'
  | 'cards'
  | 'luggage_before'
  | 'luggage_after';

// One person's count for one category. Stats are cumulative across the whole
// trip; day_number is kept for schema compatibility and is always STATS_DAY.
export interface StatEntry {
  id: string;
  user_id: string;
  day_number: number;
  category: StatCategory;
  count: number;
  updated_at?: string;
}

// A settlement transfer produced by the debt-minimization routine.
export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

// A logged (past-tense) settlement, reconstructed from a 'settlement' expense
// row joined to its single split (the receiver). Carries the real row id so it
// can be reversed.
export interface SettledPayment extends Transfer {
  id: string; // the settlement expense id
  created_at?: string;
}
