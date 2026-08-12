import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './supabaseAdmin';
import { defaultCurrencies } from './currency';
import { tripDayFromRow, type TripDay } from './trip';
import { assembleWrapped, type WrappedData } from './wrapped';
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
  TripSettings,
} from './types';

function createServerReader(): SupabaseClient | null {
  const admin = createAdminClient();
  if (admin) return admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type WrappedLoadResult =
  | { ok: true; data: WrappedData }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'error'; message?: string };

/** Server-only loader for Trip Wrapped. Prefer service role when RLS is locked. */
export async function loadWrappedTrip(tripId: string): Promise<WrappedLoadResult> {
  const db = createServerReader();
  if (!db) return { ok: false, reason: 'not_configured' };

  try {
    const [tr, td, tc, p, it, ph, ex, sp, rc, ri, settings] = await Promise.all([
      db.from('trips').select('*').eq('id', tripId).maybeSingle(),
      db.from('trip_days').select('*').eq('trip_id', tripId).order('day_number'),
      db.from('trip_currencies').select('*').eq('trip_id', tripId),
      db.from('profiles').select('*').eq('trip_id', tripId).order('created_at'),
      db.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number'),
      db.from('photos').select('*').eq('trip_id', tripId).order('created_at'),
      db.from('expenses').select('*').eq('trip_id', tripId),
      db.from('expense_splits').select('*').eq('trip_id', tripId),
      db.from('receipts').select('*').eq('trip_id', tripId),
      db.from('receipt_items').select('*').eq('trip_id', tripId),
      db.from('trip_settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (tr.error) throw tr.error;
    if (!tr.data) return { ok: false, reason: 'not_found' };

    const trip = tr.data as Trip;
    const days: TripDay[] = ((td.data ?? []) as {
      day_number: number;
      date: string;
      destination: string;
      accent_hex: string;
      country?: string;
      city?: string | null;
    }[]).map(tripDayFromRow);

    const currencies: TripCurrency[] =
      ((tc.data ?? []) as TripCurrency[]).length > 0
        ? (tc.data as TripCurrency[])
        : defaultCurrencies(
            (settings.data as TripSettings | null) ?? {
              id: 1,
              vnd_per_gbp: 0,
              thb_per_gbp: 0,
            }
          );

    const profiles = ((p.data ?? []) as Profile[]).filter((row) => !row.left_at);

    const data = assembleWrapped({
      trip,
      days,
      currencies,
      profiles,
      itinerary: (it.data ?? []) as ItineraryItem[],
      photos: (ph.data ?? []) as Photo[],
      expenses: (ex.data ?? []) as Expense[],
      splits: (sp.data ?? []) as ExpenseSplit[],
      receipts: (rc.data ?? []) as Receipt[],
      receiptItems: (ri.data ?? []) as ReceiptItem[],
    });

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: (err as Error).message || 'Could not load trip',
    };
  }
}
