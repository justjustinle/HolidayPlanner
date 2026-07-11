// Shared domain types — mirror the Supabase schema in supabase/schema.sql.

export type CurrencyCode = 'VND' | 'THB' | 'GBP';

export interface Profile {
  id: string;
  name: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface TripSettings {
  id: 1;
  vnd_per_gbp: number;
  thb_per_gbp: number;
  updated_at?: string;
}

export interface ItineraryItem {
  id: string;
  day_number: number;
  time_label: string;
  title: string;
  location: string | null;
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

export type ExpenseKind = 'manual' | 'receipt';

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

export type StatCategory = 'poop' | 'drink' | 'mosquito' | 'coffee' | 'cards';

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
