import { dayByNumber } from './trip';
import type {
  Expense,
  ExpenseSplit,
  Profile,
  Receipt,
  ReceiptItem,
} from './types';

// Escape a CSV cell (RFC 4180): quote when needed; double any quotes inside.
function csvCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function nameOf(profiles: Profile[], id: string | null | undefined): string {
  if (!id) return '';
  return profiles.find((p) => p.id === id)?.name ?? id;
}

/**
 * Build a CSV of every non-settlement expense with full field coverage:
 * expense columns, payer, day context, splits, and receipt line items.
 */
export function buildExpensesCsv(
  expenses: Expense[],
  splits: ExpenseSplit[],
  receipts: Receipt[],
  receiptItems: ReceiptItem[],
  profiles: Profile[]
): string {
  const rows = expenses
    .filter((e) => e.kind !== 'settlement')
    .slice()
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));

  const header = [
    'id',
    'created_at',
    'kind',
    'label',
    'day_number',
    'day_label',
    'destination',
    'date_label',
    'paid_by_id',
    'paid_by_name',
    'local_amount',
    'local_currency',
    'base_amount_gbp',
    'activity_id',
    'image_url',
    'split_user_ids',
    'split_names',
    'split_amounts_gbp',
    'receipt_id',
    'receipt_merchant',
    'receipt_image_url',
    'receipt_item_names',
    'receipt_item_quantities',
    'receipt_item_local_amounts',
    'receipt_item_claimed_by_ids',
    'receipt_item_claimed_by_names',
  ];

  const lines = [header.map(csvCell).join(',')];

  for (const e of rows) {
    const day = e.day_number != null ? dayByNumber(e.day_number) : undefined;
    const mySplits = splits.filter((s) => s.expense_id === e.id);
    const receipt = receipts.find((r) => r.expense_id === e.id);
    const items = receipt
      ? receiptItems.filter((i) => i.receipt_id === receipt.id)
      : [];

    lines.push(
      [
        e.id,
        e.created_at ?? '',
        e.kind,
        e.label ?? '',
        e.day_number ?? '',
        day?.label ?? '',
        day?.destination ?? '',
        day?.dateLabel ?? '',
        e.paid_by_id,
        nameOf(profiles, e.paid_by_id),
        e.local_amount,
        e.local_currency,
        e.base_amount_gbp,
        e.activity_id ?? '',
        e.image_url ?? '',
        mySplits.map((s) => s.user_id).join('; '),
        mySplits.map((s) => nameOf(profiles, s.user_id)).join('; '),
        mySplits.map((s) => s.amount_owed).join('; '),
        receipt?.id ?? '',
        receipt?.merchant ?? '',
        receipt?.image_url ?? '',
        items.map((i) => i.name).join('; '),
        items.map((i) => i.quantity).join('; '),
        items.map((i) => i.local_amount).join('; '),
        items.map((i) => i.claimed_by_id ?? '').join('; '),
        items.map((i) => nameOf(profiles, i.claimed_by_id)).join('; '),
      ]
        .map(csvCell)
        .join(',')
    );
  }

  // BOM so Excel opens UTF-8 cleanly (names / merchants with accents).
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** Trigger a browser download of the expenses CSV. */
export function downloadExpensesCsv(
  expenses: Expense[],
  splits: ExpenseSplit[],
  receipts: Receipt[],
  receiptItems: ReceiptItem[],
  profiles: Profile[],
  filename = 'planr-expenses.csv'
): void {
  const csv = buildExpensesCsv(expenses, splits, receipts, receiptItems, profiles);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
