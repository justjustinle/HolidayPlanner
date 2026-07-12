import type { CurrencyCode, TripSettings } from './types';

// Round to standard 2-decimal precision, avoiding binary float drift
// (e.g. 1.005 → 1.01, not 1.00). All money in the app passes through here.
export function round2(n: number): number {
  // Coerce strings (Postgres numerics via supabase-js) so `"1.10" + EPSILON`
  // doesn't concatenate into a NaN path.
  const value = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Convert a local amount into the GBP base currency using the group's manually
// controlled exchange rates. Rates are expressed as "local units per 1 GBP".
export function toGbp(
  amount: number,
  currency: CurrencyCode,
  settings: TripSettings
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  switch (currency) {
    case 'GBP':
      return round2(amount);
    case 'VND':
      return round2(amount / settings.vnd_per_gbp);
    case 'THB':
      return round2(amount / settings.thb_per_gbp);
    default:
      return 0;
  }
}

// Format a GBP figure for display, always two decimals.
export function formatGbp(n: number): string {
  return `£${round2(n).toFixed(2)}`;
}

// Split a GBP total equally across `count` people, correcting the last share so
// the parts always sum back to the exact total (no lost/gained pennies).
export function splitEqually(totalGbp: number, count: number): number[] {
  if (count <= 0) return [];
  const each = round2(totalGbp / count);
  const shares = Array.from({ length: count }, () => each);
  const drift = round2(totalGbp - each * count);
  shares[count - 1] = round2(shares[count - 1] + drift);
  return shares;
}
