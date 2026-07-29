import type { TimeValue } from '@/lib/time';
import type { CurrencyCode } from '@/lib/types';

/**
 * Persist in-progress create sheets so leaving the app (Maps, WhatsApp, …)
 * or switching tabs doesn’t quietly discard the form. Edit flows do not use
 * these keys — only new objects.
 *
 * Keys are optionally scoped by active trip id.
 */

const PREFIX = 'travel_draft_';

function key(kind: string, tripId: string | null | undefined): string {
  return tripId ? `${PREFIX}${kind}_v1:${tripId}` : `${PREFIX}${kind}_v1`;
}

function readJson<T>(storageKey: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(storageKey: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

function removeKey(storageKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

/** Flush helpers when the page is backgrounded (iOS often freezes timers). */
export function onPageHidden(flush: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const run = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', run);
  window.addEventListener('pagehide', flush);
  return () => {
    document.removeEventListener('visibilitychange', run);
    window.removeEventListener('pagehide', flush);
  };
}

// ── Activity ───────────────────────────────────────────────────────────────

export type ActivityCreateDraft = {
  v: 1;
  open: boolean;
  day: number;
  title: string;
  time: TimeValue;
  endTime: TimeValue | null;
  location: string;
  notes: string;
};

export function readActivityDraft(
  tripId?: string | null
): ActivityCreateDraft | null {
  const d = readJson<ActivityCreateDraft>(key('activity', tripId ?? null));
  return d?.v === 1 ? d : null;
}

export function writeActivityDraft(
  draft: ActivityCreateDraft,
  tripId?: string | null
): void {
  writeJson(key('activity', tripId ?? null), draft);
}

export function clearActivityDraft(tripId?: string | null): void {
  removeKey(key('activity', tripId ?? null));
}

export function isActivityDraftPristine(d: Omit<ActivityCreateDraft, 'v' | 'open' | 'day'>): boolean {
  return (
    !d.title.trim() &&
    !d.location.trim() &&
    !d.notes.trim() &&
    d.endTime === null &&
    d.time.hour24 === 9 &&
    d.time.minute === 0
  );
}

// ── Manual expense ─────────────────────────────────────────────────────────

export type ExpenseCreateDraft = {
  v: 1;
  open: boolean;
  label: string;
  day: number;
  currency: CurrencyCode;
  amountStr: string;
  paidById: string;
  participants: string[];
  customShares: Record<string, number> | null;
};

export function readExpenseDraft(
  tripId?: string | null
): ExpenseCreateDraft | null {
  const d = readJson<ExpenseCreateDraft>(key('expense', tripId ?? null));
  return d?.v === 1 ? d : null;
}

export function writeExpenseDraft(
  draft: ExpenseCreateDraft,
  tripId?: string | null
): void {
  writeJson(key('expense', tripId ?? null), draft);
}

export function clearExpenseDraft(tripId?: string | null): void {
  removeKey(key('expense', tripId ?? null));
}

export function isExpenseDraftPristine(
  d: Pick<ExpenseCreateDraft, 'label' | 'amountStr' | 'customShares'>
): boolean {
  return !d.label.trim() && !d.amountStr.trim() && d.customShares === null;
}

// ── Receipt ────────────────────────────────────────────────────────────────

export type ReceiptCreateDraft = {
  v: 1;
  open: boolean;
  merchant: string;
  day: number;
  currency: CurrencyCode;
  totalStr: string;
  paidById: string;
  items: { name: string; quantity: number; price: string; claimed_by_id?: string | null }[];
  scanned: boolean;
  /** Compressed image data URL — omitted when too large for localStorage. */
  preview: string | null;
};

/** ~700KB string budget so we stay under typical 5MB quotas with other keys. */
const MAX_PREVIEW_CHARS = 700_000;

export function readReceiptDraft(
  tripId?: string | null
): ReceiptCreateDraft | null {
  const d = readJson<ReceiptCreateDraft>(key('receipt', tripId ?? null));
  return d?.v === 1 ? d : null;
}

export function writeReceiptDraft(
  draft: ReceiptCreateDraft,
  tripId?: string | null
): void {
  const preview =
    draft.preview && draft.preview.length <= MAX_PREVIEW_CHARS
      ? draft.preview
      : null;
  writeJson(key('receipt', tripId ?? null), { ...draft, preview });
}

export function clearReceiptDraft(tripId?: string | null): void {
  removeKey(key('receipt', tripId ?? null));
}

export function isReceiptDraftPristine(
  d: Pick<ReceiptCreateDraft, 'merchant' | 'totalStr' | 'items' | 'preview' | 'scanned'>
): boolean {
  return (
    !d.merchant.trim() &&
    !d.totalStr.trim() &&
    d.items.length === 0 &&
    !d.preview &&
    !d.scanned
  );
}

// ── Create trip ────────────────────────────────────────────────────────────

export type TripCreateDraft = {
  v: 1;
  open: boolean;
  name: string;
  homeCurrency: string;
  origin: string;
  destinations: {
    id: string;
    country: string;
    city: string;
    startDate: string;
    endDate: string;
    accentHex: string;
  }[];
  destinationCurrencies: string[];
};

export function readTripDraft(): TripCreateDraft | null {
  const d = readJson<TripCreateDraft>(key('trip', null));
  return d?.v === 1 ? d : null;
}

export function writeTripDraft(draft: TripCreateDraft): void {
  writeJson(key('trip', null), draft);
}

export function clearTripDraft(): void {
  removeKey(key('trip', null));
}
