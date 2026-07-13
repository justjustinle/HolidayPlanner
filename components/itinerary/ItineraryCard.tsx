'use client';

import { useMemo, useState } from 'react';
import { Camera, MapPin, Pencil, Trash2 } from 'lucide-react';
import MemoriesModal from './MemoriesModal';
import AddCardSheet from './AddCardSheet';
import ConfirmDialog from '../ui/ConfirmDialog';
import { YarnTimelineNode } from './YarnTimelineRail';
import { useTripData } from '../TripDataProvider';
import { YARN_BRAND } from '@/lib/brand/yarn';
import { formatTimeLabel } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

export default function ItineraryCard({
  item,
  accentHex,
  isLast = false,
  dimmed = false,
}: {
  item: ItineraryItem;
  accentHex: string;
  isLast?: boolean;
  dimmed?: boolean;
}) {
  const { photos, deleteItineraryItem } = useTripData();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);

  const photoCount = useMemo(
    () => photos.filter((p) => p.activity_id === item.id).length,
    [photos, item.id]
  );

  const startClock = formatTimeLabel(item.time_label);
  const endClock = item.end_time_label
    ? formatTimeLabel(item.end_time_label)
    : null;

  return (
    <>
      <div
        className={`relative flex gap-3 transition-opacity ${dimmed ? 'opacity-45' : ''}`}
      >
        {/* Time column — start primary; optional end stacked below */}
        <div className="w-[52px] flex-none pt-0.5 text-right tabular-nums">
          <div className="text-[17px] font-semibold leading-none tracking-tight text-ink">
            {startClock}
          </div>
          {endClock && (
            <div className="mt-1.5 text-[13px] font-medium leading-none tracking-tight text-muted">
              {endClock}
            </div>
          )}
        </div>

        {/* Yarn thread timeline */}
        <YarnTimelineNode isLast={isLast} accentHex={accentHex} />

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
                {item.notes && (
                  <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-snug text-muted">
                    {item.notes}
                  </p>
                )}
              </div>
              <div className="mt-0.5 flex flex-none items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMemoriesOpen(true);
                  }}
                  aria-label={
                    photoCount > 0 ? `Photos, ${photoCount}` : 'Photos'
                  }
                  className="relative text-muted/55 hover:text-ink"
                >
                  <Camera size={15} />
                  {photoCount > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-0.5 text-[9px] font-semibold leading-none text-white"
                      style={{ background: YARN_BRAND.colors.gold }}
                    >
                      {photoCount}
                    </span>
                  )}
                </button>
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
