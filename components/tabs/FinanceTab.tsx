'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Download,
  PartyPopper,
  Receipt,
  ScanLine,
  Undo2,
} from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import RateSettings from '../finance/RateSettings';
import ExpenseCard from '../finance/ExpenseCard';
import UploadReceiptSheet from '../finance/UploadReceiptSheet';
import LogExpenseSheet from '../finance/LogExpenseSheet';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { formatBaseCurrency, round2 } from '@/lib/currency';
import { downloadExpensesCsv } from '@/lib/exportExpensesCsv';
import {
  computeIncurredByUser,
  computeNetBalances,
  listSettlements,
  minimizeTransfers,
  totalSpend,
} from '@/lib/settle';
import { defaultDayNumber } from '@/lib/trip';
import { formatDayMonth } from '@/lib/time';
import {
  readExpenseDraft,
  readReceiptDraft,
  writeExpenseDraft,
  writeReceiptDraft,
} from '@/lib/createDrafts';
import type { SettledPayment, Transfer } from '@/lib/types';

export default function FinanceTab() {
  const {
    profiles,
    expenses,
    splits,
    receipts,
    receiptItems,
    me,
    trip,
    currencies,
    settleUp,
    deleteExpense,
    activeTripId,
  } =
    useTripData();
  const [sheet, setSheet] = useState<'receipt' | 'expense' | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [settledOpen, setSettledOpen] = useState(false);
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Outstanding transfer awaiting settle confirmation; settlement awaiting undo.
  const [settling, setSettling] = useState<Transfer | null>(null);
  const [undoing, setUndoing] = useState<SettledPayment | null>(null);

  // Reopen in-progress create sheets after tab switches / app resume.
  useEffect(() => {
    const sync = () => {
      if (readExpenseDraft(activeTripId)?.open) setSheet('expense');
      else if (readReceiptDraft(activeTripId)?.open) setSheet('receipt');
    };
    sync();
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', sync);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', sync);
    };
  }, [activeTripId]);

  const openExpenseSheet = () => {
    const existing = readExpenseDraft(activeTripId);
    if (existing && !existing.open) {
      writeExpenseDraft({ ...existing, open: true }, activeTripId);
    }
    setSheet('expense');
  };

  const openReceiptSheet = () => {
    const existing = readReceiptDraft(activeTripId);
    if (existing && !existing.open) {
      writeReceiptDraft({ ...existing, open: true }, activeTripId);
    }
    setSheet('receipt');
  };

  const avatarFor = (id: string) => profiles.find((p) => p.id === id)?.avatar_url;
  const formatBase = (amount: number) =>
    formatBaseCurrency(amount, trip.base_currency, currencies);

  // Everything is trip-wide: expenses persist across all days of the trip.
  // Settlement rows flow through net balances as ordinary expense+split, so
  // outstanding transfers already reflect payments that have been logged.
  const { net, transfers, total, incurredByUser } = useMemo(() => {
    const net = computeNetBalances(profiles, expenses, splits, receipts, receiptItems);
    return {
      net,
      transfers: minimizeTransfers(profiles, net),
      total: totalSpend(expenses),
      incurredByUser: computeIncurredByUser(
        profiles,
        expenses,
        splits,
        receipts,
        receiptItems
      ),
    };
  }, [profiles, expenses, splits, receipts, receiptItems]);

  // Per-person share of group spend (highest first) for the total breakdown.
  const spendBreakdown = useMemo(
    () =>
      profiles
        .map((p) => ({
          profile: p,
          amount: round2(incurredByUser.get(p.id) ?? 0),
        }))
        .sort((a, b) => b.amount - a.amount),
    [profiles, incurredByUser]
  );

  // The historical log of logged settlements (newest first).
  const settledPayments = useMemo(
    () => listSettlements(profiles, expenses, splits),
    [profiles, expenses, splits]
  );

  // The expenses feed excludes settlements — they live in the settled log.
  const visible = useMemo(
    () =>
      expenses
        .filter((e) => e.kind !== 'settlement')
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [expenses]
  );

  const unclaimedCount = useMemo(
    () => receiptItems.filter((i) => i.claimed_by_id == null).length,
    [receiptItems]
  );

  // Personal summary for the logged-in user (positive = owed, negative = owes).
  const myBalance = me ? round2(net.get(me.id) ?? 0) : 0;
  const myStatus =
    myBalance > 0.005 ? 'owed' : myBalance < -0.005 ? 'owe' : 'settled';

  return (
    <div>
      <TabHeader variant="section" title="Expenses" />

      <div className="space-y-6 px-5 pb-8 pt-4">
        {me && (
          <div
            className={
              myStatus === 'owed'
                ? 'rounded-2xl border border-nhatrang/30 bg-nhatrang/[.1] px-4 py-3.5'
                : myStatus === 'owe'
                  ? 'rounded-2xl border border-saigon/30 bg-saigon/[.1] px-4 py-3.5'
                  : 'rounded-2xl border border-black/5 bg-cream-card px-4 py-3.5'
            }
          >
            {myStatus === 'owed' && (
              <p className="font-serif text-[22px] font-semibold leading-tight text-nhatrang">
                You are owed {formatBase(myBalance)}
              </p>
            )}
            {myStatus === 'owe' && (
              <p className="font-serif text-[22px] font-semibold leading-tight text-saigon">
                You owe {formatBase(Math.abs(myBalance))}
              </p>
            )}
            {myStatus === 'settled' && (
              <p className="font-serif text-[22px] font-semibold leading-tight text-ink">
                You are all settled up!
              </p>
            )}
          </div>
        )}

        {/* add actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={openReceiptSheet}
            className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[14px] font-medium text-white"
          >
            <ScanLine size={17} /> Upload receipt
          </button>
          <button
            onClick={openExpenseSheet}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-cream-card py-3 text-[14px] font-medium text-ink"
          >
            <Receipt size={17} /> Log an expense
          </button>
        </div>

        <RateSettings />

        {/* expense list — collapsed by default so it doesn't swamp the page */}
        <div>
          <button
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
            className="flex w-full items-center justify-between"
          >
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
              Expenses{visible.length > 0 ? ` (${visible.length})` : ''}
            </h2>
            <span className="flex items-center gap-2">
              {unclaimedCount > 0 && (
                <span className="text-[12px] text-saigon">
                  {unclaimedCount} unclaimed item{unclaimedCount === 1 ? '' : 's'}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`text-muted transition-transform ${listOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </button>
          {listOpen &&
            (visible.length === 0 ? (
              <div className="mt-3 rounded-2xl border-2 border-dashed border-black/10 p-6 text-center text-[13px] text-muted">
                No expenses yet. Upload a receipt or log one above.
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {visible.map((e) => (
                  <ExpenseCard key={e.id} expense={e} />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    downloadExpensesCsv(
                      expenses,
                      splits,
                      receipts,
                      receiptItems,
                      profiles,
                      `planr-expenses-${new Date().toISOString().slice(0, 10)}.csv`
                    )
                  }
                  className="flex w-full items-center justify-center gap-1.5 py-1 text-[13px] font-semibold uppercase tracking-wide text-muted"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            ))}
        </div>

        {/* settlement */}
        <div>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">
            Who pays whom
          </h2>

          {/* Outstanding debts — tap a card to log a settlement. */}
          {transfers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-cream-card p-4 text-[14px] text-muted">
              <PartyPopper size={20} className="text-nhatrang" />
              All square — nobody owes anything right now.
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSettling(t)}
                  aria-label={`Settle up ${t.fromName} to ${t.toName}`}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-cream-card p-3 text-left transition-colors hover:border-ink/20 active:bg-black/[.03]"
                >
                  <div className="flex items-center gap-2 text-[14px]">
                    <Avatar name={t.fromName} src={avatarFor(t.fromId)} size={26} />
                    <span className="text-ink">{t.fromName}</span>
                    <span className="text-muted">pays</span>
                    <Avatar name={t.toName} src={avatarFor(t.toId)} size={26} />
                    <span className="text-ink">{t.toName}</span>
                  </div>
                  <span className="font-semibold text-ink">{formatBase(t.amount)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Settled payments — collapsible historical log, closed by default. */}
          {settledPayments.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setSettledOpen((o) => !o)}
                aria-expanded={settledOpen}
                className="flex w-full items-center justify-between"
              >
                <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">
                  Show Settled Payments ({settledPayments.length})
                </span>
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform ${settledOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {settledOpen && (
                <div className="mt-2 space-y-2">
                  {settledPayments.map((s) => {
                    const paidOn = formatDayMonth(s.created_at);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-2xl border border-nhatrang/40 bg-nhatrang/[.07] p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[14px]">
                            <Avatar name={s.fromName} src={avatarFor(s.fromId)} size={26} />
                            <span className="truncate text-ink">
                              <span className="font-medium">{s.fromName}</span> paid{' '}
                              <span className="font-medium">{s.toName}</span>{' '}
                              {formatBase(s.amount)}
                            </span>
                          </div>
                          {paidOn && (
                            <p className="mt-0.5 pl-8 text-[11px] text-muted">
                              Paid {paidOn}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-none items-center gap-2">
                          <span className="flex items-center gap-1 rounded-full bg-nhatrang/15 px-2 py-0.5 text-[11px] font-semibold text-nhatrang">
                            <Check size={12} /> PAID
                          </span>
                          <button
                            onClick={() => setUndoing(s)}
                            aria-label="Undo settlement"
                            className="text-muted/60 hover:text-saigon"
                          >
                            <Undo2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* per-person balances — collapsed by default to save vertical space */}
        <div>
          <button
            onClick={() => setBalancesOpen((o) => !o)}
            aria-expanded={balancesOpen}
            className="flex w-full items-center justify-between"
          >
            <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">
              View Individual Balances ({profiles.length})
            </span>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform ${balancesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {balancesOpen && (
            <div className="mt-2 space-y-1.5 px-1">
              {profiles.map((p) => {
                const bal = round2(net.get(p.id) ?? 0);
                const positive = bal > 0.005;
                const negative = bal < -0.005;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl py-1.5 text-[14px]"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <Avatar name={p.name} src={p.avatar_url} size={24} />
                      {p.name}
                      {me?.id === p.id && <span className="text-[12px] text-muted">(you)</span>}
                    </span>
                    <span
                      className={
                        positive ? 'text-nhatrang' : negative ? 'text-saigon' : 'text-muted'
                      }
                    >
                      {positive && 'gets back '}
                      {negative && 'owes '}
                      {positive || negative ? formatBase(Math.abs(bal)) : 'settled'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* total group spend — full-width card below balances */}
        <div className="w-full rounded-2xl bg-ink px-5 py-4 text-cream">
          <div className="text-[12px] uppercase tracking-wide text-cream/60">
            Total group spend
          </div>
          <div className="mt-1 font-serif text-[30px] font-semibold leading-tight">
            {formatBase(total)}
          </div>

          {profiles.length > 0 && (
            <div className="mt-3 border-t border-cream/10 pt-3">
              <button
                type="button"
                onClick={() => setBreakdownOpen((o) => !o)}
                aria-expanded={breakdownOpen}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-[12px] font-semibold uppercase tracking-wide text-cream/60">
                  View breakdown
                </span>
                <ChevronDown
                  size={16}
                  className={`text-cream/60 transition-transform ${
                    breakdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {breakdownOpen && (
                <div className="mt-2.5 space-y-2">
                  {spendBreakdown.map(({ profile: p, amount }) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 text-[14px]"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-cream">
                        <Avatar name={p.name} src={p.avatar_url} size={24} />
                        <span className="truncate">
                          {p.name}
                          {me?.id === p.id && (
                            <span className="text-cream/50"> (you)</span>
                          )}
                        </span>
                      </span>
                      <span className="flex-none font-medium text-cream">
                        {formatBase(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {sheet === 'receipt' && (
        <UploadReceiptSheet defaultDay={defaultDayNumber()} onClose={() => setSheet(null)} />
      )}
      {sheet === 'expense' && (
        <LogExpenseSheet defaultDay={defaultDayNumber()} onClose={() => setSheet(null)} />
      )}

      {settling && (
        <ConfirmDialog
          title="Settle Up"
          message={`Log a payment of ${formatBase(settling.amount)} from ${settling.fromName} to ${settling.toName}?`}
          confirmLabel="Confirm Payment"
          tone="primary"
          onCancel={() => setSettling(null)}
          onConfirm={() => {
            const t = settling;
            setSettling(null);
            void settleUp(t.fromId, t.toId, t.amount);
          }}
        />
      )}

      {undoing && (
        <ConfirmDialog
          title="Undo settlement?"
          message={`This reverses ${undoing.fromName}'s ${formatBase(undoing.amount)} payment to ${undoing.toName} and restores the outstanding balance.`}
          confirmLabel="Undo"
          onCancel={() => setUndoing(null)}
          onConfirm={() => {
            const s = undoing;
            setUndoing(null);
            void deleteExpense(s.id);
          }}
        />
      )}
    </div>
  );
}
