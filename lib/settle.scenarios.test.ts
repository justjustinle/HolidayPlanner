/**
 * Ten settle-math scenarios for the Thailand & Vietnam trip group (5 users).
 *
 * Covers the expense kinds the app logs (manual equal-split, receipt claims,
 * multi-currency FX, penny rounding, settle-up / undo) and a cumulative
 * 20+ row trip ledger that must still balance.
 *
 * Run: npm run test:settle
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import { round2, splitEqually, toGbp } from './currency';
import {
  amountIncurredOnExpense,
  computeNetBalances,
  localShareFromBase,
  totalSpend,
} from './settle';
import {
  ALEX,
  JO,
  PRIYA,
  RATES,
  SAM,
  TOM,
  USERS,
  addManual,
  addReceipt,
  balancesObject,
  emptyLedger,
  incurred,
  netSum,
  nets,
  resetIds,
  settle,
  settleAllSuggested,
  settlements,
  spend,
  transfers,
  undoSettlement,
  type Ledger,
} from './settle-scenarios';

const EPS = 0.005;

function assertZeroSum(ledger: Ledger, label: string): void {
  const sum = netSum(nets(ledger));
  assert.ok(
    Math.abs(sum) < EPS,
    `${label}: nets must sum to ~0, got ${sum} (${JSON.stringify(balancesObject(nets(ledger)))})`
  );
}

function assertCleared(net: Map<string, number>, label: string): void {
  for (const [id, v] of net) {
    const name = USERS.find((p) => p.id === id)?.name ?? id;
    assert.ok(
      Math.abs(v) < EPS,
      `${label}: ${name} should be settled to ~0, got ${v}`
    );
  }
}

beforeEach(() => {
  resetIds();
});

// ---------------------------------------------------------------------------
// 1. Equal 5-way split
// ---------------------------------------------------------------------------
describe('Scenario 1 — Equal 5-way split', () => {
  it('Alex pays £100 dinner split five ways; everyone owes £20', () => {
    const ledger = emptyLedger();
    addManual(ledger, {
      label: 'Group dinner Bangkok',
      dayNumber: 1,
      amount: 100,
      currency: 'GBP',
      paidById: ALEX,
      participantIds: [ALEX, SAM, JO, PRIYA, TOM],
    });

    const net = nets(ledger);
    assert.equal(net.get(ALEX), 80); // paid 100, owes 20
    assert.equal(net.get(SAM), -20);
    assert.equal(net.get(JO), -20);
    assert.equal(net.get(PRIYA), -20);
    assert.equal(net.get(TOM), -20);
    assertZeroSum(ledger, 'scenario 1');

    const t = transfers(ledger);
    assert.equal(t.length, 4);
    assert.ok(t.every((x) => x.toId === ALEX && x.amount === 20));
    assert.equal(spend(ledger), 100);

    // Incurred = each person's share of the bill, regardless of who paid.
    const byUser = incurred(ledger);
    assert.equal(byUser.get(ALEX), 20);
    assert.equal(byUser.get(SAM), 20);
    assert.equal(byUser.get(JO), 20);
    assert.equal(byUser.get(PRIYA), 20);
    assert.equal(byUser.get(TOM), 20);
    const incurredSum = round2(
      [...byUser.values()].reduce((s, n) => s + n, 0)
    );
    assert.equal(incurredSum, spend(ledger));
  });

  it('amountIncurredOnExpense matches each persons trip-level share of the dinner', () => {
    const ledger = emptyLedger();
    const expenseId = addManual(ledger, {
      label: 'Group dinner Bangkok',
      dayNumber: 1,
      amount: 100,
      currency: 'GBP',
      paidById: ALEX,
      participantIds: [ALEX, SAM, JO, PRIYA, TOM],
    });
    const expense = ledger.expenses.find((e) => e.id === expenseId)!;
    for (const id of [ALEX, SAM, JO, PRIYA, TOM]) {
      assert.equal(
        amountIncurredOnExpense(
          expense,
          id,
          ledger.splits,
          ledger.receipts,
          ledger.receiptItems
        ),
        20
      );
    }
    assert.equal(localShareFromBase(100, 100, 20), 20);
  });

  it('Upcoming future-dated expenses are excluded until their payment date', () => {
    const ledger = emptyLedger();
    addManual(ledger, {
      label: 'Due later hotel',
      dayNumber: 2,
      amount: 200,
      currency: 'GBP',
      paidById: ALEX,
      participantIds: [ALEX, SAM],
    });
    const exp = ledger.expenses[ledger.expenses.length - 1];
    exp.is_upcoming = true;
    exp.payment_date = '2099-01-15';

    assert.equal(spend(ledger), 0);
    const net = nets(ledger);
    assert.equal(net.get(ALEX), 0);
    assert.equal(net.get(SAM), 0);
    assert.equal(incurred(ledger).get(ALEX) ?? 0, 0);

    // Once the payment date arrives (local midnight), it counts.
    const onDueDay = new Date(2099, 0, 15, 0, 0, 0);
    assert.equal(totalSpend(ledger.expenses, onDueDay), 200);
    const dueNet = computeNetBalances(
      USERS,
      ledger.expenses,
      ledger.splits,
      ledger.receipts,
      ledger.receiptItems,
      onDueDay
    );
    assert.equal(dueNet.get(ALEX), 100);
    assert.equal(dueNet.get(SAM), -100);
  });
});

// ---------------------------------------------------------------------------
// 2. Subset splits (not everyone on every bill)
// ---------------------------------------------------------------------------
describe('Scenario 2 — Subset participant splits', () => {
  it('Only people on the trip share; outsiders stay at zero', () => {
    const ledger = emptyLedger();

    // Taxi: Sam, Jo, Tom — Sam paid £60
    addManual(ledger, {
      label: 'Airport taxi',
      dayNumber: 1,
      amount: 60,
      currency: 'GBP',
      paidById: SAM,
      participantIds: [SAM, JO, TOM],
    });

    // Massage: Priya + Alex — Priya paid £40
    addManual(ledger, {
      label: 'Thai massage',
      dayNumber: 2,
      amount: 40,
      currency: 'GBP',
      paidById: PRIYA,
      participantIds: [PRIYA, ALEX],
    });

    const net = nets(ledger);
    // Sam: +60 − 20 = +40
    assert.equal(net.get(SAM), 40);
    // Jo: −20
    assert.equal(net.get(JO), -20);
    // Tom: −20
    assert.equal(net.get(TOM), -20);
    // Priya: +40 − 20 = +20
    assert.equal(net.get(PRIYA), 20);
    // Alex: −20
    assert.equal(net.get(ALEX), -20);

    assertZeroSum(ledger, 'scenario 2');
    assert.equal(spend(ledger), 100);
  });
});

// ---------------------------------------------------------------------------
// 3. Multi-currency FX (THB + VND + GBP)
// ---------------------------------------------------------------------------
describe('Scenario 3 — Multi-currency FX conversion', () => {
  it('THB and VND convert via group rates before splitting', () => {
    const ledger = emptyLedger();

    // ฿2,230 → £50.00 (2230 / 44.6)
    const thbGbp = toGbp(2230, 'THB', RATES);
    assert.equal(thbGbp, 50);

    addManual(ledger, {
      label: 'Street food Yaowarat',
      dayNumber: 1,
      amount: 2230,
      currency: 'THB',
      paidById: PRIYA,
      participantIds: [ALEX, SAM, JO, PRIYA, TOM],
    });

    // ₫704,000 → £20.00 (704000 / 35200)
    const vndGbp = toGbp(704000, 'VND', RATES);
    assert.equal(vndGbp, 20);

    addManual(ledger, {
      label: 'Grab to District 1',
      dayNumber: 7,
      amount: 704000,
      currency: 'VND',
      paidById: JO,
      participantIds: [JO, ALEX],
    });

    // Alex also logs a GBP coffee for himself only (£3.50)
    addManual(ledger, {
      label: 'Solo flat white',
      dayNumber: 3,
      amount: 3.5,
      currency: 'GBP',
      paidById: ALEX,
      participantIds: [ALEX],
    });

    const net = nets(ledger);
    // Priya: +50 − 10 = +40
    assert.equal(net.get(PRIYA), 40);
    // Jo: +20 − 10 − 10 = 0
    assert.equal(net.get(JO), 0);
    // Alex: −10 − 10 + 3.5 − 3.5 = −20
    assert.equal(net.get(ALEX), -20);
    // Sam, Tom: −10 each
    assert.equal(net.get(SAM), -10);
    assert.equal(net.get(TOM), -10);

    assertZeroSum(ledger, 'scenario 3');
    assert.equal(spend(ledger), 73.5);
  });
});

// ---------------------------------------------------------------------------
// 4. Penny rounding (uneven equal split)
// ---------------------------------------------------------------------------
describe('Scenario 4 — Penny rounding on uneven splits', () => {
  it('splitEqually corrects the last share so parts sum to the total', () => {
    const shares3 = splitEqually(10, 3);
    assert.deepEqual(shares3, [3.33, 3.33, 3.34]);
    assert.equal(round2(shares3.reduce((a, b) => a + b, 0)), 10);

    const shares5 = splitEqually(100, 3);
    assert.deepEqual(shares5, [33.33, 33.33, 33.34]);

    const ledger = emptyLedger();
    addManual(ledger, {
      label: 'Snacks that do not divide',
      dayNumber: 4,
      amount: 10,
      currency: 'GBP',
      paidById: TOM,
      participantIds: [TOM, SAM, JO],
    });

    const net = nets(ledger);
    // Participants [Tom, Sam, Jo] → shares 3.33, 3.33, 3.34 (drift on last).
    // Tom paid 10, owes 3.33 → +6.67
    assert.equal(net.get(TOM), 6.67);
    assert.equal(net.get(SAM), -3.33);
    assert.equal(net.get(JO), -3.34);
    assertZeroSum(ledger, 'scenario 4');

    // Suggested transfers must clear
    const cleared = settleAllSuggested(ledger);
    assertCleared(cleared, 'scenario 4 after settle');
  });
});

// ---------------------------------------------------------------------------
// 5. Receipt — all line items claimed
// ---------------------------------------------------------------------------
describe('Scenario 5 — Receipt with every item claimed', () => {
  it('Each claimer owes their proportional GBP share of the bill', () => {
    const ledger = emptyLedger();

    // Sam pays ฿560 (= £12.56). Items: 240 + 120 + 200 = 560.
    addReceipt(ledger, {
      label: 'Chatuchak food court',
      dayNumber: 2,
      amount: 560,
      currency: 'THB',
      paidById: SAM,
      items: [
        { name: 'Pad thai', quantity: 2, localAmount: 240, claimedById: ALEX },
        { name: 'Mango sticky rice', quantity: 1, localAmount: 120, claimedById: JO },
        { name: 'Coconut shakes', quantity: 2, localAmount: 200, claimedById: PRIYA },
      ],
    });

    const totalGbp = toGbp(560, 'THB', RATES); // 12.56
    assert.equal(totalGbp, 12.56);

    const net = nets(ledger);
    // Sam paid 12.56, claimed nothing → +12.56
    assert.equal(net.get(SAM), 12.56);
    // Alex owes 240/560 * 12.56 = 5.382… → 5.38
    assert.equal(net.get(ALEX), -round2((240 / 560) * 12.56));
    assert.equal(net.get(JO), -round2((120 / 560) * 12.56));
    assert.equal(net.get(PRIYA), -round2((200 / 560) * 12.56));
    assert.equal(net.get(TOM), 0);

    assertZeroSum(ledger, 'scenario 5');
    // Receipts contribute to spend
    assert.equal(spend(ledger), 12.56);

    const byUser = incurred(ledger);
    assert.equal(byUser.get(ALEX), round2((240 / 560) * 12.56));
    assert.equal(byUser.get(JO), round2((120 / 560) * 12.56));
    assert.equal(byUser.get(PRIYA), round2((200 / 560) * 12.56));
    assert.equal(byUser.get(SAM), 0); // paid, claimed nothing
    assert.equal(byUser.get(TOM), 0);
    assert.equal(
      round2([...byUser.values()].reduce((s, n) => s + n, 0)),
      spend(ledger)
    );
  });

  it('amountIncurredOnExpense returns each claimers share, and 0 for the payer who claimed nothing', () => {
    const ledger = emptyLedger();
    const expenseId = addReceipt(ledger, {
      label: 'Chatuchak food court',
      dayNumber: 2,
      amount: 560,
      currency: 'THB',
      paidById: SAM,
      items: [
        { name: 'Pad thai', quantity: 2, localAmount: 240, claimedById: ALEX },
        { name: 'Mango sticky rice', quantity: 1, localAmount: 120, claimedById: JO },
        { name: 'Coconut shakes', quantity: 2, localAmount: 200, claimedById: PRIYA },
      ],
    });
    const expense = ledger.expenses.find((e) => e.id === expenseId)!;
    const alexShare = round2((240 / 560) * 12.56);
    assert.equal(
      amountIncurredOnExpense(
        expense,
        ALEX,
        ledger.splits,
        ledger.receipts,
        ledger.receiptItems
      ),
      alexShare
    );
    assert.equal(
      amountIncurredOnExpense(
        expense,
        SAM,
        ledger.splits,
        ledger.receipts,
        ledger.receiptItems
      ),
      0
    );
    assert.equal(localShareFromBase(560, 12.56, alexShare), round2(560 * (alexShare / 12.56)));
  });
});

// ---------------------------------------------------------------------------
// 6. Receipt — unclaimed lines fall back to the payer
// ---------------------------------------------------------------------------
describe('Scenario 6 — Receipt with unclaimed items', () => {
  it('Unclaimed lines are owed by the payer so books still balance', () => {
    const ledger = emptyLedger();

    addReceipt(ledger, {
      label: 'Night market',
      dayNumber: 3,
      amount: 890,
      currency: 'THB',
      paidById: ALEX,
      items: [
        { name: 'Grilled pork', quantity: 1, localAmount: 250, claimedById: SAM },
        { name: 'Beer tower', quantity: 1, localAmount: 400, claimedById: null }, // Alex
        { name: 'Fruit shake', quantity: 2, localAmount: 240, claimedById: JO },
      ],
    });

    const totalGbp = toGbp(890, 'THB', RATES);
    const net = nets(ledger);

    // Alex paid totalGbp, owes the unclaimed beer share
    const alexOwes = round2((400 / 890) * totalGbp);
    assert.equal(net.get(ALEX), round2(totalGbp - alexOwes));
    assert.equal(net.get(SAM), -round2((250 / 890) * totalGbp));
    assert.equal(net.get(JO), -round2((240 / 890) * totalGbp));
    assert.equal(net.get(PRIYA), 0);
    assert.equal(net.get(TOM), 0);

    assertZeroSum(ledger, 'scenario 6');
  });
});

// ---------------------------------------------------------------------------
// 7. Receipt — service charge / tax gap between items and total
// ---------------------------------------------------------------------------
describe('Scenario 7 — Receipt service-charge gap', () => {
  it('Gap between item sum and bill total is spread proportionally', () => {
    const ledger = emptyLedger();

    // Items sum to ฿900 but bill is ฿990 (10% service). Paid in GBP for clarity.
    addReceipt(ledger, {
      label: 'Rooftop bar',
      dayNumber: 5,
      amount: 99, // GBP
      currency: 'GBP',
      paidById: TOM,
      items: [
        { name: 'Cocktails', quantity: 3, localAmount: 600, claimedById: ALEX },
        { name: 'Sharing platter', quantity: 1, localAmount: 300, claimedById: SAM },
      ],
    });

    const net = nets(ledger);
    // Item proportions of 900: Alex 600/900, Sam 300/900 — applied to £99
    assert.equal(net.get(ALEX), -round2((600 / 900) * 99)); // -66
    assert.equal(net.get(SAM), -round2((300 / 900) * 99)); // -33
    assert.equal(net.get(TOM), 99); // paid full bill, claimed nothing
    assert.equal(net.get(JO), 0);
    assert.equal(net.get(PRIYA), 0);

    assert.equal(net.get(ALEX), -66);
    assert.equal(net.get(SAM), -33);
    assertZeroSum(ledger, 'scenario 7');
  });
});

// ---------------------------------------------------------------------------
// 8. Settle Up clears one outstanding transfer
// ---------------------------------------------------------------------------
describe('Scenario 8 — Settle Up clears a single transfer', () => {
  it('Logging a settlement zeros that pair and updates who-pays-whom', () => {
    const ledger = emptyLedger();

    addManual(ledger, {
      label: 'Hotel deposit',
      dayNumber: 1,
      amount: 200,
      currency: 'GBP',
      paidById: ALEX,
      participantIds: [ALEX, SAM],
    });

    // Before: Alex +100, Sam −100
    let net = nets(ledger);
    assert.equal(net.get(ALEX), 100);
    assert.equal(net.get(SAM), -100);
    assert.deepEqual(
      transfers(ledger).map((t) => ({ from: t.fromName, to: t.toName, amount: t.amount })),
      [{ from: 'Sam', to: 'Alex', amount: 100 }]
    );

    settle(ledger, SAM, ALEX, 100);

    net = nets(ledger);
    assert.equal(net.get(ALEX), 0);
    assert.equal(net.get(SAM), 0);
    assert.equal(transfers(ledger).length, 0);

    // Settlement is NOT group spend
    assert.equal(spend(ledger), 200);

    const logged = settlements(ledger);
    assert.equal(logged.length, 1);
    assert.equal(logged[0].fromName, 'Sam');
    assert.equal(logged[0].toName, 'Alex');
    assert.equal(logged[0].amount, 100);
  });
});

// ---------------------------------------------------------------------------
// 9. Multiple settlements, undo, remaining debt
// ---------------------------------------------------------------------------
describe('Scenario 9 — Multiple settlements with undo', () => {
  it('Partial settles leave remainder; undo restores the prior balance', () => {
    const ledger = emptyLedger();

    // Complex web of debts
    addManual(ledger, {
      label: 'Island boat',
      dayNumber: 4,
      amount: 250,
      currency: 'GBP',
      paidById: JO,
      participantIds: [ALEX, SAM, JO, PRIYA, TOM],
    });
    addManual(ledger, {
      label: 'Grocery run',
      dayNumber: 5,
      amount: 75,
      currency: 'GBP',
      paidById: PRIYA,
      participantIds: [PRIYA, TOM, SAM],
    });

    assertZeroSum(ledger, 'scenario 9 before settle');
    const before = balancesObject(nets(ledger));
    const suggested = transfers(ledger);
    assert.ok(suggested.length >= 2, 'expect multiple outstanding transfers');

    // Settle only the first suggested transfer
    const first = suggested[0];
    const settleId = settle(ledger, first.fromId, first.toId, first.amount);

    const mid = nets(ledger);
    assertZeroSum(ledger, 'scenario 9 after one settle');
    // That specific debt should be reduced — at least one fewer/smaller transfer
    const remaining = transfers(ledger);
    assert.ok(
      remaining.every(
        (t) => !(t.fromId === first.fromId && t.toId === first.toId && t.amount === first.amount)
      ),
      'exact settled transfer should no longer appear'
    );

    // Undo restores pre-settlement balances
    undoSettlement(ledger, settleId);
    assert.deepEqual(balancesObject(nets(ledger)), before);
    assert.equal(settlements(ledger).length, 0);

    // Settle everything → all zero
    const cleared = settleAllSuggested(ledger);
    assertCleared(cleared, 'scenario 9 full clear');
    assert.ok(settlements(ledger).length >= 1);
    // Spend still excludes settlements
    assert.equal(spend(ledger), 325);
  });
});

// ---------------------------------------------------------------------------
// 10. Full trip ledger — 20+ expense rows across kinds + settles
// ---------------------------------------------------------------------------
describe('Scenario 10 — Full trip ledger (20+ rows) stays correct', () => {
  it('After 20+ expenses and several settle-ups, books still balance and clear', () => {
    const ledger = emptyLedger();
    const all = [ALEX, SAM, JO, PRIYA, TOM];

    // --- Day 1 Bangkok ---
    addManual(ledger, {
      label: 'Airport taxi BKK',
      dayNumber: 1,
      amount: 450,
      currency: 'THB',
      paidById: ALEX,
      participantIds: all,
    });
    addManual(ledger, {
      label: 'Street food Chinatown',
      dayNumber: 1,
      amount: 1800,
      currency: 'THB',
      paidById: SAM,
      participantIds: all,
    });
    addManual(ledger, {
      label: '7-Eleven beers',
      dayNumber: 1,
      amount: 320,
      currency: 'THB',
      paidById: TOM,
      participantIds: [TOM, SAM, JO],
    });

    // --- Day 2 ---
    addReceipt(ledger, {
      label: 'Chatuchak lunch',
      dayNumber: 2,
      amount: 640,
      currency: 'THB',
      paidById: JO,
      items: [
        { name: 'Pad see ew', quantity: 1, localAmount: 180, claimedById: JO },
        { name: 'Som tum', quantity: 1, localAmount: 120, claimedById: PRIYA },
        { name: 'Mango sticky rice', quantity: 2, localAmount: 200, claimedById: ALEX },
        { name: 'Thai iced tea', quantity: 2, localAmount: 140, claimedById: null }, // Jo
      ],
    });
    addManual(ledger, {
      label: 'Temple entry fees',
      dayNumber: 2,
      amount: 500,
      currency: 'THB',
      paidById: PRIYA,
      participantIds: all,
    });

    // --- Day 3–4 Phuket ---
    addManual(ledger, {
      label: 'Flight BKK → HKT',
      dayNumber: 3,
      amount: 95,
      currency: 'GBP',
      paidById: ALEX,
      participantIds: all,
    });
    addManual(ledger, {
      label: 'Hotel Phuket night 1',
      dayNumber: 3,
      amount: 4200,
      currency: 'THB',
      paidById: SAM,
      participantIds: all,
    });
    addManual(ledger, {
      label: 'Scooter rental',
      dayNumber: 4,
      amount: 600,
      currency: 'THB',
      paidById: TOM,
      participantIds: [TOM, JO],
    });
    addReceipt(ledger, {
      label: 'Beach club',
      dayNumber: 4,
      amount: 3500,
      currency: 'THB',
      paidById: PRIYA,
      items: [
        // Items 3000; bill 3500 → 500 service spread proportionally
        { name: 'Daybeds', quantity: 2, localAmount: 1600, claimedById: ALEX },
        { name: 'Cocktails', quantity: 4, localAmount: 1400, claimedById: SAM },
      ],
    });
    addManual(ledger, {
      label: 'Phi Phi boat trip',
      dayNumber: 4,
      amount: 15000,
      currency: 'THB',
      paidById: JO,
      participantIds: all,
    });

    // --- Day 5–6 ---
    addManual(ledger, {
      label: 'Dinner bangla road',
      dayNumber: 5,
      amount: 2750,
      currency: 'THB',
      paidById: ALEX,
      participantIds: [ALEX, SAM, JO, TOM],
    });
    addManual(ledger, {
      label: 'Pharmacy / mosquito cream',
      dayNumber: 5,
      amount: 280,
      currency: 'THB',
      paidById: PRIYA,
      participantIds: [PRIYA, SAM],
    });
    addManual(ledger, {
      label: 'Uneven snack split',
      dayNumber: 6,
      amount: 10,
      currency: 'GBP',
      paidById: TOM,
      participantIds: [TOM, SAM, JO],
    });

    // --- Mid-trip settle-up (Sam pays Alex what is outstanding between them) ---
    assertZeroSum(ledger, 'scenario 10 mid-trip before settle');
    const midTransfers = transfers(ledger);
    assert.ok(midTransfers.length >= 1);
    // Settle the largest suggested transfer only
    const biggest = [...midTransfers].sort((a, b) => b.amount - a.amount)[0];
    settle(ledger, biggest.fromId, biggest.toId, biggest.amount, '2026-09-01T10:00:00Z');

    // --- Day 7–9 Saigon ---
    addManual(ledger, {
      label: 'Flight HKT → SGN',
      dayNumber: 7,
      amount: 110,
      currency: 'GBP',
      paidById: SAM,
      participantIds: all,
    });
    addManual(ledger, {
      label: 'Grab from Tan Son Nhat',
      dayNumber: 7,
      amount: 250000,
      currency: 'VND',
      paidById: JO,
      participantIds: all,
    });
    addReceipt(ledger, {
      label: 'Pho dinner',
      dayNumber: 7,
      amount: 850000,
      currency: 'VND',
      paidById: ALEX,
      items: [
        { name: 'Pho bo', quantity: 2, localAmount: 300000, claimedById: ALEX },
        { name: 'Pho ga', quantity: 2, localAmount: 280000, claimedById: PRIYA },
        { name: 'Bia Saigon', quantity: 5, localAmount: 270000, claimedById: TOM },
      ],
    });
    addManual(ledger, {
      label: 'War Remnants Museum',
      dayNumber: 8,
      amount: 200000,
      currency: 'VND',
      paidById: PRIYA,
      participantIds: all,
    });
    addManual(ledger, {
      label: 'Cafe sua da round',
      dayNumber: 8,
      amount: 175000,
      currency: 'VND',
      paidById: TOM,
      participantIds: [TOM, ALEX, SAM, JO],
    });
    addManual(ledger, {
      label: 'Banh mi breakfast',
      dayNumber: 9,
      amount: 225000,
      currency: 'VND',
      paidById: SAM,
      participantIds: all,
    });

    // --- Day 10–12 Nha Trang ---
    addManual(ledger, {
      label: 'Train / bus to Nha Trang',
      dayNumber: 10,
      amount: 55,
      currency: 'GBP',
      paidById: JO,
      participantIds: all,
    });
    addManual(ledger, {
      label: 'Snorkeling trip',
      dayNumber: 11,
      amount: 3200000,
      currency: 'VND',
      paidById: ALEX,
      participantIds: all,
    });
    addReceipt(ledger, {
      label: 'Seafood dinner',
      dayNumber: 11,
      amount: 2100000,
      currency: 'VND',
      paidById: PRIYA,
      items: [
        { name: 'Grilled squid', quantity: 1, localAmount: 450000, claimedById: SAM },
        { name: 'Lobster', quantity: 1, localAmount: 900000, claimedById: JO },
        { name: 'Clams', quantity: 1, localAmount: 350000, claimedById: TOM },
        { name: 'Rice + veg', quantity: 5, localAmount: 250000, claimedById: null }, // Priya
      ],
    });
    addManual(ledger, {
      label: 'Final beach beers',
      dayNumber: 12,
      amount: 480000,
      currency: 'VND',
      paidById: TOM,
      participantIds: [TOM, ALEX, SAM],
    });
    addManual(ledger, {
      label: 'Airport departure tax pool',
      dayNumber: 13,
      amount: 40,
      currency: 'GBP',
      paidById: SAM,
      participantIds: all,
    });

    // --- Assertions on the big ledger ---
    const expenseRows = ledger.expenses.length;
    const nonSettlement = ledger.expenses.filter((e) => e.kind !== 'settlement').length;
    assert.ok(
      expenseRows >= 20,
      `expected ≥20 expense rows (incl. settlements), got ${expenseRows}`
    );
    assert.ok(
      nonSettlement >= 20,
      `expected ≥20 non-settlement expenses, got ${nonSettlement}`
    );

    assertZeroSum(ledger, 'scenario 10 final before clear');

    // Spend excludes the mid-trip settlement
    const settlementTotal = ledger.expenses
      .filter((e) => e.kind === 'settlement')
      .reduce((s, e) => round2(s + e.base_amount_gbp), 0);
    const rawSum = round2(
      ledger.expenses.reduce((s, e) => round2(s + e.base_amount_gbp), 0)
    );
    assert.equal(spend(ledger), round2(rawSum - settlementTotal));
    assert.ok(spend(ledger) > 0);

    // Manual split shares always sum to their expense
    for (const e of ledger.expenses.filter((x) => x.kind === 'manual')) {
      const parts = ledger.splits.filter((s) => s.expense_id === e.id);
      const owed = round2(parts.reduce((s, p) => s + p.amount_owed, 0));
      assert.equal(
        owed,
        e.base_amount_gbp,
        `manual "${e.label}" splits ${owed} ≠ total ${e.base_amount_gbp}`
      );
    }

    // Who-pays-whom transfers, when applied, clear everyone
    const beforeClear = balancesObject(nets(ledger));
    const outstanding = transfers(ledger);
    assert.ok(outstanding.length >= 1, 'still some debt before final clear');

    // Apply all remaining suggested settles
    for (const t of outstanding) {
      settle(ledger, t.fromId, t.toId, t.amount);
    }

    assertCleared(nets(ledger), 'scenario 10 after full settle-up');
    assert.equal(transfers(ledger).length, 0);
    assertZeroSum(ledger, 'scenario 10 after full settle-up');

    // Settled log has the mid-trip one + the final clear set
    const logged = settlements(ledger);
    assert.ok(logged.length >= 1 + outstanding.length);
    assert.ok(logged.every((s) => s.amount > 0));

    // Sanity: nobody's pre-clear absolute balance exceeded total spend
    const maxAbs = Math.max(...Object.values(beforeClear).map((v) => Math.abs(v)));
    assert.ok(maxAbs <= spend(ledger) + EPS);
  });
});
