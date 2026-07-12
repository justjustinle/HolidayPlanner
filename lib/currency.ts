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

// Convert a GBP base amount back into local currency using the group's rates.
export function fromGbp(
  amountGbp: number,
  currency: CurrencyCode,
  settings: TripSettings
): number {
  if (!Number.isFinite(amountGbp) || amountGbp <= 0) return 0;
  switch (currency) {
    case 'GBP':
      return round2(amountGbp);
    case 'VND':
      return round2(amountGbp * settings.vnd_per_gbp);
    case 'THB':
      return round2(amountGbp * settings.thb_per_gbp);
    default:
      return 0;
  }
}

// Format a GBP figure for display, always two decimals.
export function formatGbp(n: number): string {
  return `£${round2(n).toFixed(2)}`;
}

// Split a total equally across `count` people, correcting the last share so
// the parts always sum back to the exact total (no lost/gained pennies).
// Used for both GBP base shares and local-currency prefills.
export function splitEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const each = round2(total / count);
  const shares = Array.from({ length: count }, () => each);
  const drift = round2(total - each * count);
  shares[count - 1] = round2(shares[count - 1] + drift);
  return shares;
}

// Turn local-currency custom shares (that already sum to `localTotal`) into
// GBP `amount_owed` rows that sum exactly to `baseGbp`.
export function localSharesToGbp(
  localShares: number[],
  localTotal: number,
  baseGbp: number
): number[] {
  if (localShares.length === 0) return [];
  if (!(localTotal > 0) || !(baseGbp > 0)) {
    return localShares.map(() => 0);
  }
  const shares = localShares.map((local) => round2(baseGbp * (local / localTotal)));
  const drift = round2(baseGbp - shares.reduce((sum, n) => sum + n, 0));
  shares[shares.length - 1] = round2(shares[shares.length - 1] + drift);
  return shares;
}

// True when the given GBP shares match an equal split of `baseGbp`
// (order-independent). Used to detect custom splits when editing.
export function isEqualSplit(baseGbp: number, sharesGbp: number[]): boolean {
  if (sharesGbp.length === 0) return true;
  const equal = [...splitEqually(baseGbp, sharesGbp.length)].sort((a, b) => a - b);
  const actual = [...sharesGbp].map(round2).sort((a, b) => a - b);
  return equal.every((n, i) => n === actual[i]);
}
