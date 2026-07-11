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
  photo_url: string | null;
  created_at?: string;
}

export interface Expense {
  id: string;
  activity_id: string;
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

export interface ChecklistItem {
  id: string;
  label: string;
  scope: 'group' | 'individual';
  owner_id: string | null;
  checked: boolean;
  created_at?: string;
}

// A settlement transfer produced by the debt-minimization routine.
export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}
