'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import LogExpenseSheet from './LogExpenseSheet';
import UploadReceiptSheet from './UploadReceiptSheet';
import ReceiptViewer from './ReceiptViewer';
import { useTripData } from '../TripDataProvider';
import { formatBaseCurrency, formatMoney, round2, symbolFor } from '@/lib/currency';
import {
  amountIncurredOnExpense,
  isUpcomingPending,
  localShareFromBase,
  receiptTaxMultiplier,
} from '@/lib/settle';
import { dayByNumber, parseLocalDate } from '@/lib/trip';
import type { Expense } from '@/lib/types';

function formatPaymentDate(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

// One expense row in the Expenses tab. Each card shows the viewer's personal
// share ("your share") so it's obvious how much that expense cost them.
// Receipt expenses also list line items with tap-to-claim chips. Tapping a
// receipt opens the receipt editor; tapping a manual expense opens the log
// sheet. Claim amounts include proportional tax/service when the receipt
// total exceeds the item subtotal — so a £100 bill with £93 of items shares
// the £7 gap across whoever claims each line. Attached photos (receipt scans
// or manual payment proof) show as a thumbnail — tap the thumb to view
// full-screen without editing.
export default function ExpenseCard({ expense }: { expense: Expense }) {
  const { profiles, me, trip, splits, receipts, receiptItems, tripDays, currencies, setItemClaim, deleteExpense } =
    useTripData();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(false);

  const profileOf = (id: string | null) => profiles.find((p) => p.id === id);
  const payer = profileOf(expense.paid_by_id);
  const day = expense.day_number ? dayByNumber(expense.day_number, tripDays) : undefined;

  const receipt = receipts.find((r) => r.expense_id === expense.id);
  const items = receipt ? receiptItems.filter((i) => i.receipt_id === receipt.id) : [];
  const isReceipt = expense.kind === 'receipt';
  const receiptImageUrl = isReceipt
    ? receipt?.image_url ?? null
    : expense.image_url ?? null;
  const upcomingPending = isUpcomingPending(expense);

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

  // Viewer's personal cost for this expense (GBP), plus local equivalent.
  const myShareGbp = me
    ? amountIncurredOnExpense(expense, me.id, splits, receipts, receiptItems)
    : 0;
  const hasMyShare = myShareGbp > 0.005;
  const myShareLocal = localShareFromBase(
    expense.local_amount,
    expense.base_amount_gbp,
    myShareGbp
  );
  const localSym = symbolFor(expense.local_currency, currencies);
  const showGbpAlongside = expense.local_currency !== trip.base_currency;

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer rounded-2xl border border-black/5 bg-cream-card px-4 py-3.5"
    >
      {/*
        Three columns keep the group total and "your share" on one right
        edge. The trash icon has its own column so it no longer shoves the
        total left of the share amount.
      */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_1.25rem] items-start gap-x-2">
        <div className="min-w-0 text-[15px] font-medium leading-snug text-ink">
          {expense.label ?? 'Expense'}
        </div>

        <div className="flex items-start gap-2">
          {receiptImageUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewingReceipt(true);
              }}
              aria-label={isReceipt ? 'View receipt photo' : 'View payment photo'}
              className="h-11 w-11 overflow-hidden rounded-lg border border-black/10 bg-black/[.04] shadow-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          )}
          <div className="text-right tabular-nums">
            <div className="text-[15px] font-semibold leading-snug text-ink">
              {formatMoney(expense.local_amount, localSym)}
            </div>
            {showGbpAlongside && (
              <div className="mt-px text-[11px] leading-tight text-muted">
                {formatBaseCurrency(expense.base_amount_gbp, trip.base_currency, currencies)}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(true);
          }}
          aria-label="Delete expense"
          className="mt-0.5 justify-self-end text-muted/45 hover:text-saigon"
        >
          <Trash2 size={15} />
        </button>

        <div className="col-start-1 mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] leading-none text-muted">
          <Avatar name={payer?.name ?? '?'} src={payer?.avatar_url} size={18} />
          {payer?.name ?? 'Someone'} paid
          {day && <span>· {day.label}</span>}
          {isReceipt && <span>· receipt</span>}
          {upcomingPending && (
            <span className="rounded-full bg-bangkok/15 px-2 py-0.5 text-[11px] font-semibold text-bangkok">
              Upcoming
              {expense.payment_date
                ? ` · ${formatPaymentDate(expense.payment_date)}`
                : ''}
            </span>
          )}
        </div>

        {hasMyShare && (
          <>
            <div className="col-span-3 mt-3 border-t border-black/[.07]" />
            <div className="self-center pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Your share
            </div>
            <div className="pt-2.5 text-right tabular-nums">
              <div className="text-[15px] font-semibold leading-snug text-ink">
                {formatMoney(myShareLocal, localSym)}
              </div>
              {showGbpAlongside && (
                <div className="mt-px text-[11px] leading-tight text-muted">
                  {formatBaseCurrency(myShareGbp, trip.base_currency, currencies)}
                </div>
              )}
            </div>
            <span />
          </>
        )}
      </div>

      {/* receipt expense: claimable line items */}
      {items.length > 0 && (
        <div
          className={`mt-3 space-y-1.5 pt-3 ${
            hasMyShare ? '' : 'border-t border-black/5'
          }`}
        >
          {hasTaxGap && (
            <p className="text-[11px] font-medium text-nhatrang">
              Incl. {symbolFor(expense.local_currency, currencies)}
              {taxGapLocal.toLocaleString()} tax/service — split proportionally on claim
            </p>
          )}
          {items.map((item) => {
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

      {viewingReceipt && receiptImageUrl && (
        <div onClick={(e) => e.stopPropagation()}>
          <ReceiptViewer
            src={receiptImageUrl}
            alt={expense.label ?? 'Receipt'}
            onClose={() => setViewingReceipt(false)}
          />
        </div>
      )}
    </div>
  );
}
