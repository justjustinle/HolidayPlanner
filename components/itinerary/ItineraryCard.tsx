'use client';

import { useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import PolaroidCarousel from './PolaroidCarousel';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useTripData } from '../TripDataProvider';
import type { ItineraryItem } from '@/lib/types';

export default function ItineraryCard({
  item,
  accentHex,
}: {
  item: ItineraryItem;
  accentHex: string;
}) {
  const { deleteItineraryItem } = useTripData();
  const [confirming, setConfirming] = useState(false);

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
          onClick={() => setConfirming(true)}
          aria-label="Delete activity"
          className="flex-none text-muted/60 hover:text-saigon"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mx-auto mt-3 w-full">
        <PolaroidCarousel item={item} />
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete activity?"
          message={`"${item.title}" and its photos will be removed for everyone.`}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            deleteItineraryItem(item.id);
          }}
        />
      )}
    </div>
  );
}
