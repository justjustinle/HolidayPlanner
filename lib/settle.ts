import type {
  Expense,
  ExpenseSplit,
  Profile,
  Receipt,
  ReceiptItem,
  SettledPayment,
  Transfer,
} from './types';
import { round2 } from './currency';
import { parseLocalDate } from './trip';

/** Proportional tax/service multiplier: receiptTotal ÷ itemSubtotal. */
export function receiptTaxMultiplier(itemSubtotal: number, receiptTotal: number): number {
  return itemSubtotal > 0 ? receiptTotal / itemSubtotal : 1;
}

/**
 * Spread a receipt's GBP total across line items by local-amount weight.
 * Last share absorbs any leftover penny so shares always sum to the bill.
 */
export function receiptLineSharesGbp(
  items: { local_amount: number }[],
  baseAmountGbp: number
): number[] {
  const itemSubtotal = items.reduce((sum, i) => sum + i.local_amount, 0);
  if (itemSubtotal <= 0 || items.length === 0) return items.map(() => 0);

  const shares = items.map((item) =>
    round2((item.local_amount / itemSubtotal) * baseAmountGbp)
  );
  const allocated = round2(shares.reduce((s, n) => s + n, 0));
  shares[shares.length - 1] = round2(
    shares[shares.length - 1] + (baseAmountGbp - allocated)
  );
  return shares;
}

/**
 * True while an expense is marked upcoming and its payment date is still in
 * the future on the device-local calendar. Evaluated at read time — no job
 * flips the flag when the date arrives.
 *
 * `payment_date` is `YYYY-MM-DD`. It becomes included at local midnight on
 * that calendar day (i.e. once `now >= start of payment_date`).
 */
export function isUpcomingPending(
  expense: Pick<Expense, 'is_upcoming' | 'payment_date'>,
  now: Date = new Date()
): boolean {
  if (!expense.is_upcoming) return false;
  const raw = expense.payment_date?.trim();
  if (!raw) return true; // upcoming without a date stays excluded defensively
  const due = parseLocalDate(raw);
  if (Number.isNaN(due.getTime())) return true;
  return now < due;
}

/** Expenses that should count toward balances / spend / incurred totals. */
export function expensesIncludedInBalances(
  expenses: Expense[],
  now: Date = new Date()
): Expense[] {
  return expenses.filter((e) => !isUpcomingPending(e, now));
}

// Net balance for one person = total they PAID − total they OWE (their shares).
// Positive → the group owes them (creditor). Negative → they owe (debtor).
//
// Manual expenses owe via expense_splits. Receipt expenses owe via claimed
// line items: each claimed item is owed by its claimer, and unclaimed items
// fall back to the payer (so books always balance even mid-claiming). Any
// service charge / tax gap between line items and the receipt total is spread
// proportionally across the items.
//
// Upcoming expenses whose payment date is still in the future are excluded
// (along with their splits / receipt claims) until that date arrives.
export function computeNetBalances(
  profiles: Profile[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  receipts: Receipt[] = [],
  receiptItems: ReceiptItem[] = [],
  now: Date = new Date()
): Map<string, number> {
  const net = new Map<string, number>();
  for (const p of profiles) net.set(p.id, 0);
  const add = (id: string, delta: number) => {
    if (net.has(id)) net.set(id, round2((net.get(id) ?? 0) + delta));
  };

  const included = expensesIncludedInBalances(expenses, now);
  const includedIds = new Set(included.map((e) => e.id));

  for (const e of included) {
    add(e.paid_by_id, e.base_amount_gbp);
  }
  for (const s of splits) {
    if (!includedIds.has(s.expense_id)) continue;
    add(s.user_id, -s.amount_owed);
  }

  for (const r of receipts) {
    const expense = included.find((e) => e.id === r.expense_id);
    if (!expense) continue;
    const items = receiptItems.filter((i) => i.receipt_id === r.id);
    const itemSubtotal = items.reduce((sum, i) => sum + i.local_amount, 0);
    if (itemSubtotal <= 0) {
      // No parseable lines — the payer carries the whole bill.
      add(expense.paid_by_id, -expense.base_amount_gbp);
      continue;
    }
    const shares = receiptLineSharesGbp(items, expense.base_amount_gbp);
    for (let i = 0; i < items.length; i++) {
      const ower = items[i].claimed_by_id ?? expense.paid_by_id;
      add(ower, -shares[i]);
    }
  }

  for (const [id, v] of net) net.set(id, round2(v));
  return net;
}

// Greedy debt minimization: repeatedly settle the largest debtor against the
// largest creditor, producing a minimal set of "X owes Y £Z" transfers.
export function minimizeTransfers(
  profiles: Profile[],
  net: Map<string, number>
): Transfer[] {
  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.name ?? 'Someone';

  const EPS = 0.005; // ignore sub-penny residue
  const creditors = [...net.entries()]
    .filter(([, v]) => v > EPS)
    .map(([id, v]) => ({ id, amount: v }));
  const debtors = [...net.entries()]
    .filter(([, v]) => v < -EPS)
    .map(([id, v]) => ({ id, amount: -v })); // store as positive owed

  const transfers: Transfer[] = [];
  let guard = 0;
  while (creditors.length && debtors.length && guard++ < 10000) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    const c = creditors[0];
    const d = debtors[0];
    const pay = round2(Math.min(c.amount, d.amount));

    if (pay > 0) {
      transfers.push({
        fromId: d.id,
        fromName: nameOf(d.id),
        toId: c.id,
        toName: nameOf(c.id),
        amount: pay,
      });
    }

    c.amount = round2(c.amount - pay);
    d.amount = round2(d.amount - pay);
    if (c.amount <= EPS) creditors.shift();
    if (d.amount <= EPS) debtors.shift();
  }
  return transfers;
}

// Total group spend in GBP. Settlements are money moving between members, not
// group spend, so they're excluded. Upcoming-not-yet-due expenses are too.
export function totalSpend(expenses: Expense[], now: Date = new Date()): number {
  return round2(
    expensesIncludedInBalances(expenses, now)
      .filter((e) => e.kind !== 'settlement')
      .reduce((sum, e) => sum + e.base_amount_gbp, 0)
  );
}

/**
 * Total expense each person incurred (their share / amount owed) across all
 * group spend — regardless of who paid. Settlements are excluded. Manual
 * expenses use expense_splits; receipts use claimed line shares (unclaimed
 * lines fall back to the payer). Sums should match `totalSpend`.
 */
export function computeIncurredByUser(
  profiles: Profile[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  receipts: Receipt[] = [],
  receiptItems: ReceiptItem[] = [],
  now: Date = new Date()
): Map<string, number> {
  const incurred = new Map<string, number>();
  for (const p of profiles) incurred.set(p.id, 0);
  const add = (id: string, delta: number) => {
    if (incurred.has(id)) incurred.set(id, round2((incurred.get(id) ?? 0) + delta));
  };

  const included = expensesIncludedInBalances(expenses, now).filter(
    (e) => e.kind !== 'settlement'
  );
  const includedIds = new Set(included.map((e) => e.id));
  const receiptExpenseIds = new Set(receipts.map((r) => r.expense_id));

  for (const e of included) {
    if (e.kind === 'receipt' || receiptExpenseIds.has(e.id)) continue;
    for (const s of splits) {
      if (s.expense_id === e.id) add(s.user_id, s.amount_owed);
    }
  }

  for (const r of receipts) {
    const expense = included.find((e) => e.id === r.expense_id);
    if (!expense) continue;
    const items = receiptItems.filter((i) => i.receipt_id === r.id);
    const itemSubtotal = items.reduce((sum, i) => sum + i.local_amount, 0);
    if (itemSubtotal <= 0) {
      add(expense.paid_by_id, expense.base_amount_gbp);
      continue;
    }
    const shares = receiptLineSharesGbp(items, expense.base_amount_gbp);
    for (let i = 0; i < items.length; i++) {
      const ower = items[i].claimed_by_id ?? expense.paid_by_id;
      add(ower, shares[i]);
    }
  }

  for (const [id, v] of incurred) incurred.set(id, round2(v));
  return incurred;
}

// Reconstruct the log of logged settlements (newest first) from 'settlement'
// expense rows. paid_by_id is the payer/debtor; the single split's user_id is
// the receiver. Rows missing their split are skipped defensively.
export function listSettlements(
  profiles: Profile[],
  expenses: Expense[],
  splits: ExpenseSplit[]
): SettledPayment[] {
  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.name ?? 'Someone';

  return expenses
    .filter((e) => e.kind === 'settlement')
    .map((e): SettledPayment | null => {
      const split = splits.find((s) => s.expense_id === e.id);
      if (!split) return null;
      return {
        id: e.id,
        fromId: e.paid_by_id,
        fromName: nameOf(e.paid_by_id),
        toId: split.user_id,
        toName: nameOf(split.user_id),
        amount: round2(e.base_amount_gbp),
        created_at: e.created_at,
      };
    })
    .filter((s): s is SettledPayment => s !== null)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
}
