'use client';

import { useMemo, useState } from 'react';
import { Camera, MapPin, Pencil, Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet';
import ConfirmDialog from '../ui/ConfirmDialog';
import AddCardSheet from './AddCardSheet';
import MemoriesModal from './MemoriesModal';
import { useTripData } from '../TripDataProvider';
import { YARN_BRAND } from '@/lib/brand/yarn';
import { dayByNumber } from '@/lib/trip';
import { hapticLight } from '@/lib/motion';
import { formatTimeLabel } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

export default function ViewActivitySheet({
  item,
  onClose,
}: {
  item: ItineraryItem;
  onClose: () => void;
}) {
  const { photos, deleteItineraryItem } = useTripData();
  const [editing, setEditing] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const activityPhotos = useMemo(
    () => photos.filter((p) => p.activity_id === item.id),
    [photos, item.id]
  );
  const photoCount = activityPhotos.length;
  const previewUrl = activityPhotos[activityPhotos.length - 1]?.url ?? null;
  const day = dayByNumber(item.day_number);
  const startClock = formatTimeLabel(item.time_label);
  const endClock = item.end_time_label
    ? formatTimeLabel(item.end_time_label)
    : null;

  if (editing) {
    return (
      <AddCardSheet
        day={item.day_number}
        item={item}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
      />
    );
  }

  return (
    <>
      <Sheet title="View activity" onClose={onClose}>
        {day && (
          <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
            <span
              className="inline-block h-2 w-2 flex-none rounded-full"
              style={{ background: day.accentHex }}
            />
            {day.label} · {day.destination} · {day.dateLabel}
          </div>
        )}

        <h3 className="font-serif text-[22px] font-semibold leading-tight text-ink">
          {item.title}
        </h3>

        <p className="mt-1.5 text-[14px] tabular-nums text-muted">
          {startClock}
          {endClock && (
            <>
              <span className="mx-1.5 text-[11px] font-semibold uppercase tracking-wider">
                to
              </span>
              {endClock}
            </>
          )}
        </p>

        {item.location && (
          <a
            href={
              item.location.startsWith('http')
                ? item.location
                : `https://maps.google.com/?q=${encodeURIComponent(item.location)}`
            }
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-1.5 text-[14px] text-muted"
          >
            <MapPin size={14} className="flex-none" />
            <span className="truncate">{item.location}</span>
          </a>
        )}

        {item.notes && (
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink/80">
            {item.notes}
          </p>
        )}

        {previewUrl && (
          <div className="relative mt-4 h-28 w-28 overflow-visible">
            <div className="h-28 w-28 overflow-hidden rounded-xl border border-black/10 bg-black/[.04] shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
            <span
              className="absolute -bottom-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold leading-none text-white"
              style={{ background: YARN_BRAND.colors.gold }}
            >
              {photoCount}
            </span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => setMemoriesOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-black/10 bg-cream-card px-4 py-3.5 text-left text-[15px] font-medium text-ink"
          >
            <Camera size={18} className="flex-none text-muted" />
            <span className="min-w-0 flex-1">
              {photoCount > 0
                ? `Photos (${photoCount})`
                : 'Add photos'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-black/10 bg-cream-card px-4 py-3.5 text-left text-[15px] font-medium text-ink"
          >
            <Pencil size={18} className="flex-none text-muted" />
            Edit activity
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-black/10 bg-cream-card px-4 py-3.5 text-left text-[15px] font-medium text-saigon"
          >
            <Trash2 size={18} className="flex-none" />
            Delete activity
          </button>
        </div>
      </Sheet>

      {memoriesOpen && (
        <MemoriesModal item={item} onClose={() => setMemoriesOpen(false)} />
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete activity?"
          message={`"${item.title}" and its photos will be removed for everyone.`}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            hapticLight();
            setConfirming(false);
            deleteItineraryItem(item.id);
            onClose();
          }}
        />
      )}
    </>
  );
}
