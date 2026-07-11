'use client';

import { useMemo } from 'react';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import RateSettings from '../finance/RateSettings';
import Avatar from '../ui/Avatar';
import { formatGbp, round2 } from '@/lib/currency';
import { computeNetBalances, minimizeTransfers, totalSpend } from '@/lib/settle';

export default function FinanceTab() {
  const { profiles, expenses, splits, me } = useTripData();

  const avatarFor = (id: string) => profiles.find((p) => p.id === id)?.avatar_url;

  const { net, transfers, total } = useMemo(() => {
    const net = computeNetBalances(profiles, expenses, splits);
    return {
      net,
      transfers: minimizeTransfers(profiles, net),
      total: totalSpend(expenses),
    };
  }, [profiles, expenses, splits]);

  return (
    <div>
      <TabHeader eyebrow="Shared expenses" title="Money" />

      <div className="space-y-6 px-5 pt-2">
        {/* total */}
        <div className="rounded-2xl bg-ink px-5 py-4 text-cream">
          <div className="text-[12px] uppercase tracking-wide text-cream/60">
            Total group spend
          </div>
          <div className="mt-1 font-serif text-[30px] font-semibold">
            {formatGbp(total)}
          </div>
        </div>

        <RateSettings />

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

        {expenses.length === 0 && (
          <p className="pb-4 text-center text-[13px] text-muted">
            No bills yet. Log one from any activity card in the Itinerary tab.
          </p>
        )}
      </div>
    </div>
  );
}
