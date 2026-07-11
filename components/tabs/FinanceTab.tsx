'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, PartyPopper, Receipt, ScanLine } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import DayPicker from '../ui/DayPicker';
import RateSettings from '../finance/RateSettings';
import ExpenseCard from '../finance/ExpenseCard';
import UploadReceiptSheet from '../finance/UploadReceiptSheet';
import LogExpenseSheet from '../finance/LogExpenseSheet';
import Avatar from '../ui/Avatar';
import { formatGbp, round2 } from '@/lib/currency';
import { computeNetBalances, minimizeTransfers, totalSpend } from '@/lib/settle';
import { defaultDayNumber } from '@/lib/trip';

export default function FinanceTab() {
  const { profiles, expenses, splits, receipts, receiptItems, me } = useTripData();
  const [day, setDay] = useState(0); // 0 = all days
  const [sheet, setSheet] = useState<'receipt' | 'expense' | null>(null);

  const avatarFor = (id: string) => profiles.find((p) => p.id === id)?.avatar_url;

  // Settlement is always trip-wide; the day picker only filters the list below.
  const { net, transfers, total } = useMemo(() => {
    const net = computeNetBalances(profiles, expenses, splits, receipts, receiptItems);
    return {
      net,
      transfers: minimizeTransfers(profiles, net),
      total: totalSpend(expenses),
    };
  }, [profiles, expenses, splits, receipts, receiptItems]);

  const visible = useMemo(
    () =>
      expenses
        .filter((e) => day === 0 || e.day_number === day)
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [expenses, day]
  );
  const dayTotal = useMemo(() => totalSpend(visible), [visible]);

  const unclaimedCount = useMemo(
    () => receiptItems.filter((i) => i.claimed_by_id == null).length,
    [receiptItems]
  );

  return (
    <div>
      <TabHeader eyebrow="Shared expenses" title="Money" />

      <div className="px-5">
        <DayPicker value={day} onChange={setDay} allowAll />
      </div>

      <div className="space-y-6 px-5 pt-1">
        {/* total */}
        <div className="rounded-2xl bg-ink px-5 py-4 text-cream">
          <div className="text-[12px] uppercase tracking-wide text-cream/60">
            {day === 0 ? 'Total group spend' : `Day ${day} spend`}
          </div>
          <div className="mt-1 font-serif text-[30px] font-semibold">
            {formatGbp(day === 0 ? total : dayTotal)}
          </div>
          {day !== 0 && (
            <div className="text-[12px] text-cream/60">trip total {formatGbp(total)}</div>
          )}
        </div>

        {/* add actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSheet('receipt')}
            className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[14px] font-medium text-white"
          >
            <ScanLine size={17} /> Upload receipt
          </button>
          <button
            onClick={() => setSheet('expense')}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-cream-card py-3 text-[14px] font-medium text-ink"
          >
            <Receipt size={17} /> Log an expense
          </button>
        </div>

        {/* expense list */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
              Expenses{day !== 0 && ` · Day ${day}`}
            </h2>
            {unclaimedCount > 0 && (
              <span className="text-[12px] text-saigon">
                {unclaimedCount} unclaimed item{unclaimedCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {visible.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-black/10 p-6 text-center text-[13px] text-muted">
              No expenses {day === 0 ? 'yet' : `on Day ${day}`}. Upload a receipt or log
              one above.
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((e) => (
                <ExpenseCard key={e.id} expense={e} />
              ))}
            </div>
          )}
        </div>

        {/* settlement */}
        <div>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">
            Who pays whom
          </h2>

          {transfers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-cream-card p-4 text-[14px] text-muted">
              <PartyPopper size={20} className="text-nhatrang" />
              All square — nobody owes anything right now.
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-cream-card p-3"
                >
                  <div className="flex items-center gap-2 text-[14px]">
                    <Avatar name={t.fromName} src={avatarFor(t.fromId)} size={26} />
                    <span className="text-ink">{t.fromName}</span>
                    <ArrowRight size={15} className="text-muted" />
                    <Avatar name={t.toName} src={avatarFor(t.toId)} size={26} />
                    <span className="text-ink">{t.toName}</span>
                  </div>
                  <span className="font-semibold text-ink">{formatGbp(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* per-person balances */}
        <div>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">
            Balances
          </h2>
          <div className="space-y-1.5">
            {profiles.map((p) => {
              const bal = round2(net.get(p.id) ?? 0);
              const positive = bal > 0.005;
              const negative = bal < -0.005;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl px-1 py-1.5 text-[14px]"
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
                    {positive || negative ? formatGbp(Math.abs(bal)) : 'settled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pb-8">
          <RateSettings />
        </div>
      </div>

      {sheet === 'receipt' && (
        <UploadReceiptSheet
          defaultDay={day || defaultDayNumber()}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'expense' && (
        <LogExpenseSheet
          defaultDay={day || defaultDayNumber()}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
