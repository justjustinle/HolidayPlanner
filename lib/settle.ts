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

// Net balance for one person = total they PAID − total they OWE (their shares).
// Positive → the group owes them (creditor). Negative → they owe (debtor).
//
// Manual expenses owe via expense_splits. Receipt expenses owe via claimed
// line items: each claimed item is owed by its claimer, and unclaimed items
// fall back to the payer (so books always balance even mid-claiming). Any
// service charge / tax gap between line items and the receipt total is spread
// proportionally across the items.
export function computeNetBalances(
  profiles: Profile[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  receipts: Receipt[] = [],
  receiptItems: ReceiptItem[] = []
): Map<string, number> {
  const net = new Map<string, number>();
  for (const p of profiles) net.set(p.id, 0);
  const add = (id: string, delta: number) => {
    if (net.has(id)) net.set(id, round2((net.get(id) ?? 0) + delta));
  };

  for (const e of expenses) {
    add(e.paid_by_id, e.base_amount_gbp);
  }
  for (const s of splits) {
    add(s.user_id, -s.amount_owed);
  }

  for (const r of receipts) {
    const expense = expenses.find((e) => e.id === r.expense_id);
    if (!expense) continue;
    const items = receiptItems.filter((i) => i.receipt_id === r.id);
    const itemSum = items.reduce((sum, i) => sum + i.local_amount, 0);
    if (itemSum <= 0) {
      // No parseable lines — the payer carries the whole bill.
      add(expense.paid_by_id, -expense.base_amount_gbp);
      continue;
    }
    for (const item of items) {
      const ower = item.claimed_by_id ?? expense.paid_by_id;
      add(ower, -round2((item.local_amount / itemSum) * expense.base_amount_gbp));
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
// group spend, so they're excluded.
export function totalSpend(expenses: Expense[]): number {
  return round2(
    expenses
      .filter((e) => e.kind !== 'settlement')
      .reduce((sum, e) => sum + e.base_amount_gbp, 0)
  );
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
