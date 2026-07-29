'use client';

import { useMemo, useState } from 'react';
import { Camera, MapPin, MessageCircle, Pencil, Trash2 } from 'lucide-react';
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

function mapsSearchUrl(location: string): string {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    return location;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

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
  const previewPhotos = activityPhotos.slice(0, 3);
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
      <Sheet
        title="Activity"
        titleClassName="font-semibold"
        onClose={onClose}
        headerActions={
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit activity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Delete activity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-saigon"
            >
              <Trash2 size={18} />
            </button>
          </>
        }
      >
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
            href={mapsSearchUrl(item.location)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-1.5 text-[14px] underline decoration-[color-mix(in_srgb,var(--city-accent)_55%,transparent)] underline-offset-[3px]"
            style={{ color: 'var(--city-accent)' }}
          >
            <MapPin size={14} className="flex-none opacity-80" />
            <span className="truncate">{item.location}</span>
          </a>
        )}

        {item.notes && (
          <div className="mt-3 flex max-w-full items-start gap-1.5 rounded-xl bg-black/[.04] px-2.5 py-2">
            <MessageCircle
              size={14}
              className="mt-0.5 flex-none text-muted"
              aria-hidden
            />
            <p className="min-w-0 flex-1 whitespace-pre-wrap text-[13px] italic leading-relaxed text-ink/75">
              {item.notes}
            </p>
          </div>
        )}

        {previewPhotos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {previewPhotos.map((photo, index) => (
              <div key={photo.id} className="relative min-w-0 overflow-visible">
                <div className="aspect-square overflow-hidden rounded-xl border border-black/10 bg-black/[.04] shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Activity photo ${index + 1}`}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
                {index === previewPhotos.length - 1 && (
                  <span
                    className="absolute -bottom-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold leading-none text-white"
                    style={{ background: YARN_BRAND.colors.gold }}
                  >
                    {photoCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setMemoriesOpen(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-[15px] font-medium text-cream-card"
            style={{ background: 'var(--city-accent)' }}
          >
            <Camera size={18} className="flex-none" />
            <span>
              {photoCount > 0 ? `Photos (${photoCount})` : 'Add photos'}
            </span>
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
