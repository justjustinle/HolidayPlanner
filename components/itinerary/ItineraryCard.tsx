'use client';

import { useMemo, useState } from 'react';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import MemoriesModal from './MemoriesModal';
import AddCardSheet from './AddCardSheet';
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
  const [editing, setEditing] = useState(false);
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

        {/* Compact activity card — tap to edit (anyone) */}
        <div className="min-w-0 flex-1 pb-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setEditing(true);
              }
            }}
            className="cursor-pointer rounded-xl border border-black/5 bg-cream-card px-3.5 py-3 text-left shadow-card transition-colors hover:border-black/10 active:bg-black/[.02]"
          >
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
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-[12px] text-muted"
                  >
                    <MapPin size={12} className="flex-none" />
                    <span className="truncate">{item.location}</span>
                  </a>
                )}
              </div>
              <div className="mt-0.5 flex flex-none items-center gap-2">
                <span className="text-muted/55" aria-hidden>
                  <Pencil size={14} />
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirming(true);
                  }}
                  aria-label="Delete activity"
                  className="text-muted/55 hover:text-saigon"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMemoriesOpen(true);
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-cream px-2.5 py-1 text-[12px] font-medium text-ink transition-colors hover:border-black/15 active:scale-[0.98]"
            >
              <span aria-hidden>📸</span>
              <span>Photos</span>
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

      {editing && (
        <AddCardSheet
          day={item.day_number}
          item={item}
          onClose={() => setEditing(false)}
        />
      )}

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
