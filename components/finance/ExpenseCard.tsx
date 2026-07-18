'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import LogExpenseSheet from './LogExpenseSheet';
import UploadReceiptSheet from './UploadReceiptSheet';
import { useTripData } from '../TripDataProvider';
import { formatBaseCurrency, round2, symbolFor } from '@/lib/currency';
import { receiptTaxMultiplier } from '@/lib/settle';
import { dayByNumber } from '@/lib/trip';
import type { Expense } from '@/lib/types';

// One expense row in the Expenses tab. Manual expenses show who's splitting;
// receipt expenses list their line items with tap-to-claim chips. Tapping a
// receipt opens the receipt editor; tapping a manual expense opens the log
// sheet. Claim amounts include proportional tax/service when the receipt
// total exceeds the item subtotal — so a £100 bill with £93 of items shares
// the £7 gap across whoever claims each line.
export default function ExpenseCard({ expense }: { expense: Expense }) {
  const { profiles, me, trip, splits, receipts, receiptItems, tripDays, currencies, setItemClaim, deleteExpense } =
    useTripData();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const profileOf = (id: string | null) => profiles.find((p) => p.id === id);
  const payer = profileOf(expense.paid_by_id);
  const day = expense.day_number ? dayByNumber(expense.day_number, tripDays) : undefined;

  const receipt = receipts.find((r) => r.expense_id === expense.id);
  const items = receipt ? receiptItems.filter((i) => i.receipt_id === receipt.id) : [];
  const mySplitters = splits.filter((s) => s.expense_id === expense.id);
  const isReceipt = expense.kind === 'receipt';

  // Line amounts scaled so tax/service on the receipt total is included.
  const { multiplier, taxGapLocal } = useMemo(() => {
    const itemSubtotal = items.reduce((sum, i) => sum + i.local_amount, 0);
    const mult = receiptTaxMultiplier(itemSubtotal, expense.local_amount);
    return {
      multiplier: mult,
      taxGapLocal: round2(expense.local_amount - itemSubtotal),
    };
  }, [items, expense.local_amount]);

  const hasTaxGap = taxGapLocal > 0.005 && items.length > 0;

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer rounded-2xl border border-black/5 bg-cream-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-ink">
            {expense.label ?? 'Expense'}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <Avatar name={payer?.name ?? '?'} src={payer?.avatar_url} size={16} />
            {payer?.name ?? 'Someone'} paid
            {day && <span>· {day.label}</span>}
            {isReceipt && <span>· receipt</span>}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <div className="text-right">
            <div className="text-[15px] font-semibold text-ink">
              {symbolFor(expense.local_currency, currencies)}
              {expense.local_amount.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted">
              {formatBaseCurrency(expense.base_amount_gbp, trip.base_currency, currencies)}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
            aria-label="Delete expense"
            className="text-muted/50 hover:text-saigon"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* manual expense: who splits it */}
      {!isReceipt && mySplitters.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1">
          <span className="mr-1 text-[11px] text-muted">split:</span>
          {mySplitters.map((s) => {
            const p = profileOf(s.user_id);
            return <Avatar key={s.id} name={p?.name ?? '?'} src={p?.avatar_url} size={20} />;
          })}
        </div>
      )}

      {/* receipt expense: claimable line items */}
      {items.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
          {hasTaxGap && (
            <p className="text-[11px] font-medium text-nhatrang">
              Incl. {symbolFor(expense.local_currency, currencies)}
              {taxGapLocal.toLocaleString()} tax/service — split proportionally on claim
            </p>
          )}
          {items.map((item, idx) => {
            const claimer = profileOf(item.claimed_by_id);
            const isMine = item.claimed_by_id != null && item.claimed_by_id === me?.id;
            const canClaim = me != null && item.claimed_by_id == null;
            const menuPrice = item.local_amount;
            const priceWithTax = round2(menuPrice * multiplier);
            const sym = symbolFor(expense.local_currency, currencies);
            return (
              <button
                key={item.id}
                disabled={!canClaim && !isMine}
                onClick={(e) => {
                  e.stopPropagation();
                  setItemClaim(item.id, isMine ? null : me!.id);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[13px] ${
                  isMine
                    ? 'border-ink bg-ink/5'
                    : claimer
                      ? 'border-black/5 bg-black/[.02]'
                      : 'border-dashed border-black/20'
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-ink">
                  {item.name}
                  {item.quantity > 1 && <span className="text-muted"> ×{item.quantity}</span>}
                </span>
                <span className="flex-none text-right">
                  <span className="font-medium text-ink">
                    {sym}
                    {priceWithTax.toLocaleString()}
                  </span>
                  <span className="ml-1 text-[11px] text-muted">
                    · {sym}
                    {menuPrice.toLocaleString()}
                  </span>
                </span>
                <span className="flex-none">
                  {claimer ? (
                    <span className="flex items-center gap-1">
                      <Avatar name={claimer.name} src={claimer.avatar_url} size={18} />
                      <span className={`text-[12px] ${isMine ? 'text-ink' : 'text-muted'}`}>
                        {isMine ? 'you' : claimer.name}
                      </span>
                    </span>
                  ) : (
                    <span className={`text-[12px] ${canClaim ? 'font-medium text-ink' : 'text-muted'}`}>
                      {canClaim ? 'Claim' : 'unclaimed'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {confirming && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmDialog
            title="Delete expense?"
            message={`"${expense.label ?? 'This expense'}" and its splits will be removed for everyone.`}
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false);
              deleteExpense(expense.id);
            }}
          />
        </div>
      )}

      {editing && (
        <div onClick={(e) => e.stopPropagation()}>
          {isReceipt ? (
            <UploadReceiptSheet
              defaultDay={expense.day_number ?? 1}
              expense={expense}
              onClose={() => setEditing(false)}
            />
          ) : (
            <LogExpenseSheet
              defaultDay={expense.day_number ?? 1}
              expense={expense}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
