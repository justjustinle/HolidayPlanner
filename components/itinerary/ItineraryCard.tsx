'use client';

import { useState } from 'react';
import { Receipt, MapPin, Trash2 } from 'lucide-react';
import Polaroid from './Polaroid';
import LogBillSheet from './LogBillSheet';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import { formatGbp } from '@/lib/currency';
import { CURRENCY_SYMBOL } from '@/lib/trip';
import type { ItineraryItem } from '@/lib/types';

export default function ItineraryCard({
  item,
  accentHex,
}: {
  item: ItineraryItem;
  accentHex: string;
}) {
  const { expenses, profiles, deleteItineraryItem } = useTripData();
  const [billOpen, setBillOpen] = useState(false);

  const cardExpenses = expenses.filter((e) => e.activity_id === item.id);
  const profileOf = (id: string) => profiles.find((p) => p.id === id);
  const nameOf = (id: string) => profileOf(id)?.name ?? 'Someone';

  return (
    <div className="rounded-2xl border border-black/5 bg-cream-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: accentHex }}>
            {item.time_label}
          </div>
          <h3 className="mt-0.5 text-[16px] font-medium text-ink">{item.title}</h3>
          {item.location && (
            <a
              href={
                item.location.startsWith('http')
                  ? item.location
                  : `https://maps.google.com/?q=${encodeURIComponent(item.location)}`
              }
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[13px] text-muted"
            >
              <MapPin size={13} />
              <span className="truncate">{item.location}</span>
            </a>
          )}
        </div>
        <button
          onClick={() => deleteItineraryItem(item.id)}
          aria-label="Delete activity"
          className="flex-none text-muted/60 hover:text-saigon"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mx-auto mt-3 w-full">
        <Polaroid activityId={item.id} photoUrl={item.photo_url} caption={item.title} />
      </div>

      {/* expenses logged against this activity */}
      {cardExpenses.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {cardExpenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-muted">
                <Avatar name={nameOf(e.paid_by_id)} src={profileOf(e.paid_by_id)?.avatar_url} size={18} />
                {nameOf(e.paid_by_id)} paid
              </span>
              <span className="text-ink">
                {CURRENCY_SYMBOL[e.local_currency]}
                {e.local_amount.toLocaleString()}{' '}
                <span className="text-muted">· {formatGbp(e.base_amount_gbp)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setBillOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-[14px] text-ink"
      >
        <Receipt size={16} />
        Log Bill
      </button>

      {billOpen && (
        <LogBillSheet
          activityId={item.id}
          activityTitle={item.title}
          onClose={() => setBillOpen(false)}
        />
      )}
    </div>
  );
}
