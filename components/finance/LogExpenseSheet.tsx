'use client';

import { useMemo, useState } from 'react';
import { List, X } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import { toGbp, formatGbp } from '@/lib/currency';
import { CURRENCY_SYMBOL, TRIP_DAYS, dayByNumber } from '@/lib/trip';
import type { CurrencyCode, Expense, ItineraryItem } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['VND', 'THB', 'GBP'];

// Log a standalone expense: name it, pick the day, enter the cost in
// VND/THB/GBP, choose who paid and who splits it. Equal split.
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
  const { profiles, me, settings, splits, itinerary, addExpense, updateExpense } = useTripData();

  const isReceipt = expense?.kind === 'receipt';

  const [label, setLabel] = useState(expense?.label ?? '');
  const [day, setDay] = useState(expense?.day_number ?? defaultDay ?? 1);
  const [currency, setCurrency] = useState<CurrencyCode>(expense?.local_currency ?? 'THB');
  const [amountStr, setAmountStr] = useState(expense ? String(expense.local_amount) : '');
  const [paidById, setPaidById] = useState<string>(
    expense?.paid_by_id ?? me?.id ?? profiles[0]?.id ?? ''
  );
  const [participants, setParticipants] = useState<string[]>(() => {
    if (!expense) return profiles.map((p) => p.id);
    const existing = splits.filter((s) => s.expense_id === expense.id).map((s) => s.user_id);
    return existing.length ? existing : profiles.map((p) => p.id);
  });
  const [busy, setBusy] = useState(false);
  const [pickingActivity, setPickingActivity] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const gbp = useMemo(
    () => toGbp(amount, currency, settings),
    [amount, currency, settings]
  );
  const perHead = participants.length ? gbp / participants.length : 0;

  const activities = useMemo(
    () =>
      [...itinerary].sort(
        (a, b) => a.day_number - b.day_number || a.time_label.localeCompare(b.time_label)
      ),
    [itinerary]
  );

  const toggleParticipant = (id: string) =>
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const pickActivity = (item: ItineraryItem) => {
    setLabel(item.title);
    setDay(item.day_number);
    setPickingActivity(false);
  };

  const canSave =
    label.trim() && amount > 0 && paidById && (isReceipt || participants.length > 0) && !busy;

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
      };
      if (expense) await updateExpense(expense.id, input);
      else await addExpense(input);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink';

  return (
    <>
    <Sheet title={expense ? 'Edit expense' : 'Log an expense'} onClose={onClose}>
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
        {TRIP_DAYS.map((d) => (
          <option key={d.dayNumber} value={d.dayNumber}>
            {d.label} · {d.destination} · {d.dateLabel}
          </option>
        ))}
      </select>

      {/* currency picker */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {CURRENCIES.map((c) => {
          const active = c === currency;
          return (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-xl border py-2.5 text-sm font-medium ${
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-black/10 bg-cream-card text-ink'
              }`}
            >
              {CURRENCY_SYMBOL[c]} {c}
            </button>
          );
        })}
      </div>

      {/* amount */}
      <div className="relative mb-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          {CURRENCY_SYMBOL[currency]}
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
        = <span className="font-semibold text-ink">{formatGbp(gbp)}</span> base
      </p>

      {/* paid by */}
      <div className="mb-2 text-xs uppercase tracking-wide text-muted">Paid by</div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {profiles.map((p) => {
          const active = p.id === paidById;
          return (
            <button
              key={p.id}
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
              {participants.length ? `${formatGbp(perHead)} each` : 'pick people'}
            </span>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {profiles.map((p) => {
              const on = participants.includes(p.id);
              return (
                <button
                  key={p.id}
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
        </>
      )}

      <button
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
    </>
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
          <button onClick={onClose} aria-label="Close" className="text-muted">
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
                        {item.time_label ? ` · ${item.time_label}` : ''}
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
