'use client';

import { useMemo, useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import MemoriesModal from './MemoriesModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useTripData } from '../TripDataProvider';
import { parseTimeLabel } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

export default function ItineraryCard({
  item,
  accentHex,
  isLast = false,
}: {
  item: ItineraryItem;
  accentHex: string;
  isLast?: boolean;
}) {
  const { photos, deleteItineraryItem } = useTripData();
  const [confirming, setConfirming] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);

  const photoCount = useMemo(
    () => photos.filter((p) => p.activity_id === item.id).length,
    [photos, item.id]
  );

  const time = parseTimeLabel(item.time_label);
  const clock = `${time.hour12}:${String(time.minute).padStart(2, '0')}`;

  return (
    <>
      <div className="relative flex gap-3">
        {/* Time column — primary scan target */}
        <div className="w-[52px] flex-none pt-0.5 text-right">
          <div className="text-[17px] font-semibold leading-none tracking-tight text-ink">
            {clock}
          </div>
          <div
            className="mt-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: accentHex }}
          >
            {time.period}
          </div>
        </div>

        {/* Timeline rail */}
        <div className="relative flex w-3 flex-none flex-col items-center">
          <span
            className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full ring-2 ring-cream"
            style={{ background: accentHex }}
            aria-hidden
          />
          {!isLast && (
            <span
              className="mt-1 w-px flex-1 bg-black/10"
              aria-hidden
            />
          )}
        </div>

        {/* Compact activity card */}
        <div className="min-w-0 flex-1 pb-4">
          <div className="rounded-xl border border-black/5 bg-cream-card px-3.5 py-3 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-medium leading-snug text-ink">{item.title}</h3>
                {item.location && (
                  <a
                    href={
                      item.location.startsWith('http')
                        ? item.location
                        : `https://maps.google.com/?q=${encodeURIComponent(item.location)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-[12px] text-muted"
                  >
                    <MapPin size={12} className="flex-none" />
                    <span className="truncate">{item.location}</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="Delete activity"
                className="mt-0.5 flex-none text-muted/55 hover:text-saigon"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMemoriesOpen(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-cream px-2.5 py-1 text-[12px] font-medium text-ink transition-colors hover:border-black/15 active:scale-[0.98]"
            >
              <span aria-hidden>📸</span>
              <span>Add/View Memories</span>
              {photoCount > 0 && (
                <span
                  className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                  style={{ background: accentHex }}
                >
                  {photoCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {memoriesOpen && (
        <MemoriesModal item={item} onClose={() => setMemoriesOpen(false)} />
      )}

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
    </>
  );
}
