// Test ledger helpers that mirror TripDataProvider's write path:
// toGbp → splitEqually for manuals, receipt claims for receipts, and
// settlement rows (paid_by = debtor, one split = receiver).

import { round2, splitEqually, toGbp } from './currency';
import {
  computeNetBalances,
  listSettlements,
  minimizeTransfers,
  totalSpend,
  computeIncurredByUser,
} from './settle';
import type {
  CurrencyCode,
  Expense,
  ExpenseSplit,
  Profile,
  Receipt,
  ReceiptItem,
  SettledPayment,
  Transfer,
  TripSettings,
} from './types';
import { SETTLEMENT_LABEL } from './types';

export const USERS: Profile[] = [
  { id: 'u-alex', name: 'Alex' },
  { id: 'u-sam', name: 'Sam' },
  { id: 'u-jo', name: 'Jo' },
  { id: 'u-priya', name: 'Priya' },
  { id: 'u-tom', name: 'Tom' },
];

export const ALEX = 'u-alex';
export const SAM = 'u-sam';
export const JO = 'u-jo';
export const PRIYA = 'u-priya';
export const TOM = 'u-tom';

// Same FX defaults as demo / production seed.
export const RATES: TripSettings = {
  id: 1,
  vnd_per_gbp: 35200,
  thb_per_gbp: 44.6,
};

export interface Ledger {
  expenses: Expense[];
  splits: ExpenseSplit[];
  receipts: Receipt[];
  receiptItems: ReceiptItem[];
}

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function resetIds(): void {
  seq = 0;
}

export function emptyLedger(): Ledger {
  return { expenses: [], splits: [], receipts: [], receiptItems: [] };
}

/** Manual equal-split expense — same shape as TripDataProvider.addExpense. */
export function addManual(
  ledger: Ledger,
  opts: {
    label: string;
    dayNumber: number;
    amount: number;
    currency: CurrencyCode;
    paidById: string;
    participantIds: string[];
    createdAt?: string;
  }
): string {
  const baseGbp = toGbp(opts.amount, opts.currency, RATES);
  const parts = opts.participantIds.length ? opts.participantIds : [opts.paidById];
  const shares = splitEqually(baseGbp, parts.length);
  const expId = id('e');

  ledger.expenses.push({
    id: expId,
    activity_id: null,
    label: opts.label,
    day_number: opts.dayNumber,
    kind: 'manual',
    local_amount: round2(opts.amount),
    local_currency: opts.currency,
    base_amount_gbp: baseGbp,
    paid_by_id: opts.paidById,
    created_at: opts.createdAt ?? `2026-08-${String(opts.dayNumber).padStart(2, '0')}T12:00:00Z`,
  });

  for (let i = 0; i < parts.length; i++) {
    ledger.splits.push({
      id: id('s'),
      expense_id: expId,
      user_id: parts[i],
      amount_owed: shares[i],
    });
  }
  return expId;
}

/** Receipt expense with claimable line items — mirrors addReceiptExpense. */
export function addReceipt(
  ledger: Ledger,
  opts: {
    label: string;
    dayNumber: number;
    amount: number;
    currency: CurrencyCode;
    paidById: string;
    items: Array<{
      name: string;
      quantity: number;
      localAmount: number;
      claimedById: string | null;
    }>;
    createdAt?: string;
  }
): string {
  const baseGbp = toGbp(opts.amount, opts.currency, RATES);
  const expId = id('e');
  const receiptId = id('r');

  ledger.expenses.push({
    id: expId,
    activity_id: null,
    label: opts.label,
    day_number: opts.dayNumber,
    kind: 'receipt',
    local_amount: round2(opts.amount),
    local_currency: opts.currency,
    base_amount_gbp: baseGbp,
    paid_by_id: opts.paidById,
    created_at: opts.createdAt ?? `2026-08-${String(opts.dayNumber).padStart(2, '0')}T18:00:00Z`,
  });

  ledger.receipts.push({
    id: receiptId,
    expense_id: expId,
    merchant: opts.label,
    image_url: null,
  });

  for (const item of opts.items) {
    ledger.receiptItems.push({
      id: id('ri'),
      receipt_id: receiptId,
      name: item.name,
      quantity: item.quantity,
      local_amount: item.localAmount,
      claimed_by_id: item.claimedById,
    });
  }
  return expId;
}

/** Peer-to-peer settle-up — mirrors TripDataProvider.settleUp. */
export function settle(
  ledger: Ledger,
  fromId: string,
  toId: string,
  amount: number,
  createdAt?: string
): string {
  const value = round2(amount);
  if (value <= 0 || fromId === toId) {
    throw new Error(`Invalid settlement: ${fromId} → ${toId} £${amount}`);
  }
  const expId = id('e');
  ledger.expenses.push({
    id: expId,
    activity_id: null,
    label: SETTLEMENT_LABEL,
    day_number: null,
    kind: 'settlement',
    local_amount: value,
    local_currency: 'GBP',
    base_amount_gbp: value,
    paid_by_id: fromId,
    created_at: createdAt ?? new Date().toISOString(),
  });
  ledger.splits.push({
    id: id('s'),
    expense_id: expId,
    user_id: toId,
    amount_owed: value,
  });
  return expId;
}

/** Undo a settlement by deleting its expense + split (mirrors deleteExpense). */
export function undoSettlement(ledger: Ledger, expenseId: string): void {
  const exp = ledger.expenses.find((e) => e.id === expenseId);
  if (!exp || exp.kind !== 'settlement') {
    throw new Error(`Not a settlement: ${expenseId}`);
  }
  ledger.expenses = ledger.expenses.filter((e) => e.id !== expenseId);
  ledger.splits = ledger.splits.filter((s) => s.expense_id !== expenseId);
}

export function nets(ledger: Ledger): Map<string, number> {
  return computeNetBalances(
    USERS,
    ledger.expenses,
    ledger.splits,
    ledger.receipts,
    ledger.receiptItems
  );
}

export function transfers(ledger: Ledger): Transfer[] {
  return minimizeTransfers(USERS, nets(ledger));
}

export function spend(ledger: Ledger): number {
  return totalSpend(ledger.expenses);
}

export function incurred(ledger: Ledger): Map<string, number> {
  return computeIncurredByUser(
    USERS,
    ledger.expenses,
    ledger.splits,
    ledger.receipts,
    ledger.receiptItems
  );
}

export function settlements(ledger: Ledger): SettledPayment[] {
  return listSettlements(USERS, ledger.expenses, ledger.splits);
}

/** Sum of all nets must be ~0 (money conserved). */
export function netSum(net: Map<string, number>): number {
  let sum = 0;
  for (const v of net.values()) sum = round2(sum + v);
  return sum;
}

/**
 * Apply every suggested transfer as a settle-up and return the resulting nets.
 * After a full clear, every balance should be ~0.
 */
export function settleAllSuggested(ledger: Ledger): Map<string, number> {
  const suggested = transfers(ledger);
  for (const t of suggested) {
    settle(ledger, t.fromId, t.toId, t.amount);
  }
  return nets(ledger);
}

export function balancesObject(net: Map<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of USERS) out[p.name] = net.get(p.id) ?? 0;
  return out;
}
