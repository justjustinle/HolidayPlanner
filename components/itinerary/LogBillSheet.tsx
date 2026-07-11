'use client';

import { useMemo, useState } from 'react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import { toGbp, formatGbp } from '@/lib/currency';
import { CURRENCY_SYMBOL } from '@/lib/trip';
import type { CurrencyCode } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['VND', 'THB', 'GBP'];

// Flow C: log a bill against an activity. Pick a currency, who paid, and who
// splits it; the GBP base amount is computed live from the group's rates.
export default function LogBillSheet({
  activityId,
  activityTitle,
  onClose,
}: {
  activityId: string;
  activityTitle: string;
  onClose: () => void;
}) {
  const { profiles, me, settings, addExpense } = useTripData();

  const [currency, setCurrency] = useState<CurrencyCode>('THB');
  const [amountStr, setAmountStr] = useState('');
  const [paidById, setPaidById] = useState<string>(me?.id ?? profiles[0]?.id ?? '');
  const [participants, setParticipants] = useState<string[]>(
    profiles.map((p) => p.id)
  );
  const [busy, setBusy] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const gbp = useMemo(
    () => toGbp(amount, currency, settings),
    [amount, currency, settings]
  );
  const perHead = participants.length ? gbp / participants.length : 0;

  const toggleParticipant = (id: string) =>
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const canSave = amount > 0 && paidById && participants.length > 0 && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await addExpense({
        activityId,
        amount,
        currency,
        paidById,
        participantIds: participants,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Log a bill" onClose={onClose}>
      <p className="-mt-2 mb-4 text-[13px] text-muted">for {activityTitle}</p>

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
              <Avatar name={p.name} size={20} />
              {p.name}
            </button>
          );
        })}
      </div>

      {/* split between */}
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
              <Avatar name={p.name} size={20} dim={!on} />
              {p.name}
            </button>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={!canSave}
        className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
      >
        Save bill
      </button>
    </Sheet>
  );
}
