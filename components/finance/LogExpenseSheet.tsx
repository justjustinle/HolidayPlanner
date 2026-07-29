'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { List, X } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import {
  toBase,
  formatBaseCurrency,
  round2,
  splitEqually,
  isEqualSplit,
  symbolFor,
} from '@/lib/currency';
import { dayByNumber } from '@/lib/trip';
import { formatTimeLabel } from '@/lib/time';
import {
  clearExpenseDraft,
  isExpenseDraftPristine,
  onPageHidden,
  readExpenseDraft,
  writeExpenseDraft,
  type ExpenseCreateDraft,
} from '@/lib/createDrafts';
import type { CurrencyCode, Expense, ItineraryItem, Profile } from '@/lib/types';

function equalLocalShares(
  participants: string[],
  total: number
): Record<string, number> {
  const parts = splitEqually(total, participants.length);
  const out: Record<string, number> = {};
  participants.forEach((id, i) => {
    out[id] = parts[i];
  });
  return out;
}

// Rebuild local custom shares from saved GBP amount_owed, proportional to the
// expense's local total (avoids FX round-trip drift).
function localSharesFromGbpSplits(
  splits: { user_id: string; amount_owed: number }[],
  localTotal: number,
  baseGbp: number
): Record<string, number> {
  if (!(baseGbp > 0) || splits.length === 0) {
    return equalLocalShares(
      splits.map((s) => s.user_id),
      localTotal
    );
  }
  const ordered = [...splits];
  const raw = ordered.map((s) => localTotal * (s.amount_owed / baseGbp));
  const rounded = raw.map((n) => round2(n));
  const drift = round2(localTotal - rounded.reduce((a, b) => a + b, 0));
  rounded[rounded.length - 1] = round2(rounded[rounded.length - 1] + drift);
  const out: Record<string, number> = {};
  ordered.forEach((s, i) => {
    out[s.user_id] = rounded[i];
  });
  return out;
}

function rescaleShares(
  prev: Record<string, number>,
  participants: string[],
  newTotal: number
): Record<string, number> {
  if (!(newTotal > 0) || participants.length === 0) return prev;
  const ordered = participants.map((id) => prev[id] ?? 0);
  const prevTotal = round2(ordered.reduce((a, b) => a + b, 0));
  if (!(prevTotal > 0)) return equalLocalShares(participants, newTotal);
  const raw = ordered.map((n) => newTotal * (n / prevTotal));
  const rounded = raw.map((n) => round2(n));
  const drift = round2(newTotal - rounded.reduce((a, b) => a + b, 0));
  rounded[rounded.length - 1] = round2(rounded[rounded.length - 1] + drift);
  const next: Record<string, number> = {};
  participants.forEach((id, i) => {
    next[id] = rounded[i];
  });
  return next;
}

// Log a standalone expense: name it, pick the day, enter the cost in
// VND/THB/GBP, choose who paid and who splits it. Equal split by default;
// "Not an even split?" opens a custom local-currency share sheet.
//
// Pass an existing `expense` to edit it instead: fields are prefilled and
// saving updates in place. Receipt expenses hide the split section — their
// line-item claims drive the settlement.
export default function LogExpenseSheet({
  defaultDay,
  expense,
  onClose,
}: {
  defaultDay: number;
  expense?: Expense;
  onClose: () => void;
}) {
  const {
    profiles,
    me,
    trip,
    splits,
    itinerary,
    tripDays,
    currencies,
    addExpense,
    updateExpense,
    activeTripId,
  } = useTripData();

  const isReceipt = expense?.kind === 'receipt';
  const creating = !expense;
  const tripKey = activeTripId;
  const saved = creating ? readExpenseDraft(tripKey) : null;

  const existingSplits = useMemo(
    () => (expense ? splits.filter((s) => s.expense_id === expense.id) : []),
    [expense, splits]
  );

  const [label, setLabel] = useState(
    () => expense?.label ?? saved?.label ?? ''
  );
  const [day, setDay] = useState(
    () => expense?.day_number ?? saved?.day ?? defaultDay ?? 1
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    () =>
      expense?.local_currency ??
      saved?.currency ??
      trip.base_currency
  );
  const [amountStr, setAmountStr] = useState(
    () => (expense ? String(expense.local_amount) : saved?.amountStr ?? '')
  );
  const [paidById, setPaidById] = useState<string>(
    () =>
      expense?.paid_by_id ??
      saved?.paidById ??
      me?.id ??
      profiles[0]?.id ??
      ''
  );
  const [participants, setParticipants] = useState<string[]>(() => {
    if (expense) {
      const existing = existingSplits.map((s) => s.user_id);
      return existing.length ? existing : profiles.map((p) => p.id);
    }
    if (saved?.participants?.length) return saved.participants;
    return profiles.map((p) => p.id);
  });
  // null = equal split. Otherwise local-currency amounts keyed by user id.
  const [customShares, setCustomShares] = useState<Record<string, number> | null>(() => {
    if (expense) {
      if (existingSplits.length === 0) return null;
      if (isEqualSplit(expense.base_amount_gbp, existingSplits.map((s) => s.amount_owed))) {
        return null;
      }
      return localSharesFromGbpSplits(
        existingSplits,
        expense.local_amount,
        expense.base_amount_gbp
      );
    }
    return saved?.customShares ?? null;
  });
  const [busy, setBusy] = useState(false);
  const [pickingActivity, setPickingActivity] = useState(false);
  const [editingCustomSplit, setEditingCustomSplit] = useState(false);

  const draftRef = useRef<ExpenseCreateDraft | null>(null);
  if (creating) {
    draftRef.current = {
      v: 1,
      open: true,
      label,
      day,
      currency,
      amountStr,
      paidById,
      participants,
      customShares,
    };
  }

  useEffect(() => {
    if (!creating || !draftRef.current) return;
    writeExpenseDraft(draftRef.current, tripKey);
  }, [
    creating,
    tripKey,
    label,
    day,
    currency,
    amountStr,
    paidById,
    participants,
    customShares,
  ]);

  useEffect(() => {
    if (!creating) return;
    return onPageHidden(() => {
      if (draftRef.current) writeExpenseDraft(draftRef.current, tripKey);
    });
  }, [creating, tripKey]);

  const dismiss = () => {
    if (creating) {
      if (
        isExpenseDraftPristine({ label, amountStr, customShares }) ||
        !draftRef.current
      ) {
        clearExpenseDraft(tripKey);
      } else {
        writeExpenseDraft({ ...draftRef.current, open: false }, tripKey);
      }
    }
    onClose();
  };

  const amount = parseFloat(amountStr) || 0;
  const gbp = useMemo(
    () => toBase(amount, currency, currencies),
    [amount, currencies, currency]
  );
  const hasRate = (currencies.find((item) => item.code === currency)?.rate_per_base ?? 0) > 0;
  const perHead = participants.length ? gbp / participants.length : 0;

  const activities = useMemo(
    () =>
      [...itinerary].sort(
        (a, b) => a.day_number - b.day_number || a.time_label.localeCompare(b.time_label)
      ),
    [itinerary]
  );

  // Amount/currency changed while a custom split is active → keep ratios,
  // rescale to the new local total. Skip the first run so edit-time loads
  // aren't rewritten.
  const skipScaleOnce = useRef(true);
  useEffect(() => {
    if (skipScaleOnce.current) {
      skipScaleOnce.current = false;
      return;
    }
    setCustomShares((prev) =>
      prev ? rescaleShares(prev, participants, amount) : prev
    );
    // participants intentionally omitted — membership changes clear custom below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency]);

  const toggleParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    // Membership changed — equal split is the safe default again.
    setCustomShares(null);
  };

  const pickActivity = (item: ItineraryItem) => {
    setLabel(item.title);
    setDay(item.day_number);
    setPickingActivity(false);
  };

  const openCustomSplit = () => {
    if (!(amount > 0) || participants.length === 0) return;
    setEditingCustomSplit(true);
  };

  const applyCustomSplit = (shares: Record<string, number>) => {
    setCustomShares(shares);
    setEditingCustomSplit(false);
  };

  const clearCustomSplit = () => {
    setCustomShares(null);
    setEditingCustomSplit(false);
  };

  const canSave =
    label.trim() &&
    amount > 0 &&
    hasRate &&
    paidById &&
    (isReceipt || participants.length > 0) &&
    !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      const input = {
        label: label.trim(),
        dayNumber: day,
        amount,
        currency,
        paidById,
        participantIds: isReceipt ? [] : participants,
        customSharesLocal:
          !isReceipt && customShares
            ? participants.map((userId) => ({
                userId,
                amount: customShares[userId] ?? 0,
              }))
            : undefined,
      };
      if (expense) await updateExpense(expense.id, input);
      else {
        await addExpense(input);
        clearExpenseDraft(tripKey);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink';

  const symbol = symbolFor(currency, currencies);
  const customSummary =
    customShares &&
    participants
      .map((id) => {
        const p = profiles.find((x) => x.id === id);
        const n = customShares[id] ?? 0;
        return `${p?.name ?? '?'}: ${symbol}${n}`;
      })
      .join(' · ');

  return (
    <>
      <Sheet title={expense ? 'Edit expense' : 'Log an expense'} onClose={dismiss}>
        <div className="relative mb-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What was it? Or Select from activities"
            autoFocus={!expense}
            className={`${inputCls} pr-12`}
          />
          <button
            type="button"
            onClick={() => setPickingActivity(true)}
            aria-label="Select from activities"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"
          >
            <List size={18} />
          </button>
        </div>

        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Day</label>
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className={`${inputCls} mb-3 appearance-none`}
        >
          {tripDays.map((d) => (
            <option key={d.dayNumber} value={d.dayNumber}>
              {d.label} · {d.destination} · {d.dateLabel}
            </option>
          ))}
        </select>

        {/* currency picker */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {currencies.map((item) => {
            const c = item.code;
            const active = c === currency;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-xl border py-2.5 text-sm font-medium ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-black/10 bg-cream-card text-ink'
                }`}
              >
                {symbolFor(c, currencies)} {c}
              </button>
            );
          })}
        </div>

        {/* amount */}
        <div className="relative mb-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            {symbol}
          </span>
          <input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            placeholder="0"
            className="w-full rounded-xl border border-black/10 bg-cream-card py-3 pl-9 pr-4 text-[18px] text-ink outline-none focus:border-ink"
          />
        </div>
        <p className="mb-4 text-right text-[13px] text-muted">
          {hasRate ? (
            <>
              ={' '}
              <span className="font-semibold text-ink">
                {formatBaseCurrency(gbp, trip.base_currency, currencies)}
              </span>{' '}
              home
            </>
          ) : (
            <span className="text-saigon">Set the {currency} exchange rate first</span>
          )}
        </p>

        {/* paid by */}
        <div className="mb-2 text-xs uppercase tracking-wide text-muted">Paid by</div>
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {profiles.map((p) => {
            const active = p.id === paidById;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaidById(p.id)}
                className={`flex flex-none items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  active ? 'border-ink bg-ink/5 text-ink' : 'border-black/10 text-muted'
                }`}
              >
                <Avatar name={p.name} src={p.avatar_url} size={20} />
                {p.name}
              </button>
            );
          })}
        </div>

        {/* split between (manual expenses; receipts split via item claims) */}
        {isReceipt ? (
          <p className="mb-6 rounded-xl bg-black/5 px-3 py-2 text-[13px] text-muted">
            This is a receipt — everyone claims their own line items in the expense
            list, so there&apos;s no split to set here.
          </p>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wide text-muted">Split between</span>
              <span className="text-[12px] text-muted">
                {customShares
                  ? 'custom split'
                  : participants.length
                    ? `${formatBaseCurrency(perHead, trip.base_currency, currencies)} each`
                    : 'pick people'}
              </span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {profiles.map((p) => {
                const on = participants.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                      on ? 'border-ink bg-ink/5 text-ink' : 'border-black/10 text-muted'
                    }`}
                  >
                    <Avatar name={p.name} src={p.avatar_url} size={20} dim={!on} />
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              {customShares ? (
                <div className="rounded-xl border border-black/10 bg-cream-card px-3 py-3">
                  <p className="mb-2 text-[13px] leading-snug text-ink">{customSummary}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openCustomSplit}
                      disabled={!(amount > 0) || participants.length === 0}
                      className="flex-1 rounded-xl border border-black/10 bg-white py-2.5 text-[13px] font-medium text-ink disabled:opacity-40"
                    >
                      Edit custom split
                    </button>
                    <button
                      type="button"
                      onClick={clearCustomSplit}
                      className="flex-1 rounded-xl border border-black/10 bg-white py-2.5 text-[13px] font-medium text-muted"
                    >
                      Reset to equal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openCustomSplit}
                  disabled={!(amount > 0) || participants.length === 0}
                  className="w-full rounded-xl border border-dashed border-black/15 bg-cream-card py-3 text-[14px] font-medium text-ink disabled:opacity-40"
                >
                  Not an even split?
                </button>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
        >
          {expense ? 'Save changes' : 'Save expense'}
        </button>
      </Sheet>

      {pickingActivity && (
        <ActivityPickerSheet
          activities={activities}
          onPick={pickActivity}
          onClose={() => setPickingActivity(false)}
        />
      )}

      {editingCustomSplit && (
        <CustomSplitSheet
          profiles={profiles}
          participants={participants}
          currency={currency}
          symbol={symbol}
          total={amount}
          initialShares={customShares}
          onApply={applyCustomSplit}
          onResetEqual={clearCustomSplit}
          onClose={() => setEditingCustomSplit(false)}
        />
      )}
    </>
  );
}

function CustomSplitSheet({
  profiles,
  participants,
  currency,
  symbol,
  total,
  initialShares,
  onApply,
  onResetEqual,
  onClose,
}: {
  profiles: Profile[];
  participants: string[];
  currency: CurrencyCode;
  symbol: string;
  total: number;
  initialShares: Record<string, number> | null;
  onApply: (shares: Record<string, number>) => void;
  onResetEqual: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const base = initialShares ?? equalLocalShares(participants, total);
    const out: Record<string, string> = {};
    for (const id of participants) {
      out[id] = String(base[id] ?? 0);
    }
    return out;
  });

  const parsed = participants.map((id) => ({
    id,
    amount: parseFloat(draft[id] || '0') || 0,
  }));
  const assigned = round2(parsed.reduce((sum, p) => sum + p.amount, 0));
  const remaining = round2(total - assigned);
  const balanced = remaining === 0 && total > 0;

  const setAmount = (id: string, raw: string) => {
    setDraft((prev) => ({ ...prev, [id]: raw.replace(/[^0-9.]/g, '') }));
  };

  const fillEqual = () => {
    const eq = equalLocalShares(participants, total);
    const next: Record<string, string> = {};
    for (const id of participants) next[id] = String(eq[id]);
    setDraft(next);
  };

  const apply = () => {
    if (!balanced) return;
    const shares: Record<string, number> = {};
    for (const p of parsed) shares[p.id] = round2(p.amount);
    onApply(shares);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] mx-auto flex max-w-app items-end animate-fade-in"
      style={{ background: 'rgba(30,20,10,.35)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar max-h-[85%] w-full animate-sheet-up overflow-auto rounded-t-[24px] bg-cream px-5 pb-8 pt-4 shadow-sheet"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/15" />
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-[19px] text-ink">Custom split</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-[13px] text-muted">
          How much each person owes of {symbol}
          {round2(total).toFixed(2)}
        </p>

        <ul className="mb-4 space-y-2">
          {participants.map((id) => {
            const p = profiles.find((x) => x.id === id);
            if (!p) return null;
            return (
              <li key={id} className="flex items-center gap-3">
                <Avatar name={p.name} src={p.avatar_url} size={32} />
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{p.name}</span>
                <div className="relative w-[7.5rem]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                    {symbol}
                  </span>
                  <input
                    value={draft[id] ?? ''}
                    onChange={(e) => setAmount(id, e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-black/10 bg-cream-card py-2.5 pl-7 pr-3 text-right text-[15px] text-ink outline-none focus:border-ink"
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <p
          className={`mb-4 text-center text-[13px] ${
            balanced ? 'text-nhatrang' : remaining > 0 ? 'text-muted' : 'text-saigon'
          }`}
        >
          {balanced
            ? 'Splits add up — ready to save'
            : remaining > 0
              ? `${symbol}${remaining.toFixed(2)} left to assign`
              : `${symbol}${Math.abs(remaining).toFixed(2)} over the total`}
        </p>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={fillEqual}
            className="flex-1 rounded-xl border border-black/10 bg-cream-card py-2.5 text-[13px] font-medium text-ink"
          >
            Prefill equal
          </button>
          <button
            type="button"
            onClick={onResetEqual}
            className="flex-1 rounded-xl border border-black/10 bg-cream-card py-2.5 text-[13px] font-medium text-muted"
          >
            Use equal split
          </button>
        </div>

        <button
          type="button"
          onClick={apply}
          disabled={!balanced}
          className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
        >
          Apply custom split
        </button>
      </div>
    </div>
  );
}

function ActivityPickerSheet({
  activities,
  onPick,
  onClose,
}: {
  activities: ItineraryItem[];
  onPick: (item: ItineraryItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] mx-auto flex max-w-app items-end animate-fade-in"
      style={{ background: 'rgba(30,20,10,.35)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar max-h-[85%] w-full animate-sheet-up overflow-auto rounded-t-[24px] bg-cream px-5 pb-8 pt-4 shadow-sheet"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/15" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-[19px] text-ink">Select activity</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted">
            <X size={20} />
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-[14px] text-muted">
            No activities logged yet. Add some on the Itinerary tab, or type a label instead.
          </div>
        ) : (
          <ul className="space-y-1">
            {activities.map((item) => {
              const day = dayByNumber(item.day_number);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onPick(item)}
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-black/5"
                  >
                    <div
                      className="mt-1 h-2.5 w-2.5 flex-none rounded-full"
                      style={{ background: day?.accentHex ?? '#999' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium text-ink">{item.title}</div>
                      <div className="truncate text-[12px] text-muted">
                        {day?.label ?? `Day ${item.day_number}`}
                        {day?.destination ? ` · ${day.destination}` : ''}
                        {item.time_label ? ` · ${formatTimeLabel(item.time_label)}` : ''}
                        {item.location ? ` · ${item.location}` : ''}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
