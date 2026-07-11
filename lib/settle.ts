import type { Expense, ExpenseSplit, Profile, Transfer } from './types';
import { round2 } from './currency';

// Net balance for one person = total they PAID − total they OWE (their shares).
// Positive → the group owes them (creditor). Negative → they owe (debtor).
export function computeNetBalances(
  profiles: Profile[],
  expenses: Expense[],
  splits: ExpenseSplit[]
): Map<string, number> {
  const net = new Map<string, number>();
  for (const p of profiles) net.set(p.id, 0);

  for (const e of expenses) {
    net.set(e.paid_by_id, round2((net.get(e.paid_by_id) ?? 0) + e.base_amount_gbp));
  }
  for (const s of splits) {
    if (!net.has(s.user_id)) continue;
    net.set(s.user_id, round2((net.get(s.user_id) ?? 0) - s.amount_owed));
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

// Total group spend in GBP.
export function totalSpend(expenses: Expense[]): number {
  return round2(expenses.reduce((sum, e) => sum + e.base_amount_gbp, 0));
}
