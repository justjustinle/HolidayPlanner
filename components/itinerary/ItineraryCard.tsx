'use client';

import { useMemo, useState } from 'react';
import { Camera, MapPin, Pencil, Trash2 } from 'lucide-react';
import MemoriesModal from './MemoriesModal';
import AddCardSheet from './AddCardSheet';
import ConfirmDialog from '../ui/ConfirmDialog';
import { YarnTimelineNode } from './YarnTimelineRail';
import { useTripData } from '../TripDataProvider';
import { YARN_BRAND } from '@/lib/brand/yarn';
import { hapticLight, MOTION } from '@/lib/motion';
import { formatTimeLabel } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

export default function ItineraryCard({
  item,
  accentHex,
  isLast = false,
  dimmed = false,
  selected = false,
  onSelect,
  /** Extra space after this row (capped time-gap between activities). */
  spacingAfter = 16,
}: {
  item: ItineraryItem;
  accentHex: string;
  isLast?: boolean;
  dimmed?: boolean;
  selected?: boolean;
  onSelect: () => void;
  spacingAfter?: number;
}) {
  const { photos, deleteItineraryItem } = useTripData();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);

  const activityPhotos = useMemo(
    () => photos.filter((p) => p.activity_id === item.id),
    [photos, item.id]
  );
  const photoCount = activityPhotos.length;
  // Most recent upload as the mini preview thumb.
  const previewUrl = activityPhotos[activityPhotos.length - 1]?.url ?? null;

  const startClock = formatTimeLabel(item.time_label);
  const endClock = item.end_time_label
    ? formatTimeLabel(item.end_time_label)
    : null;

  const toggleSelect = () => {
    if (!selected) hapticLight();
    onSelect();
  };

  return (
    <>
      <div
        className={`relative flex items-stretch gap-3 transition-opacity ${dimmed ? 'opacity-45' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Time column — start primary; optional end stacked with TO */}
        <div className="w-[56px] flex-none self-start pt-0.5 text-right tabular-nums">
          <div className="text-[17px] font-semibold leading-none tracking-tight text-ink">
            {startClock}
          </div>
          {endClock && (
            <div className="mt-1.5 text-[12px] font-medium leading-snug tracking-tight text-muted">
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                TO
              </span>{' '}
              {endClock}
            </div>
          )}
        </div>

        {/* Yarn thread timeline */}
        <YarnTimelineNode isLast={isLast} accentHex={accentHex} />

        {/* Activity card — tap to select; actions appear when selected */}
        <div
          className="min-w-0 flex-1"
          style={{ paddingBottom: isLast ? 8 : spacingAfter }}
        >
          <div
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggleSelect();
              }
            }}
            className={`cursor-pointer rounded-xl border bg-cream-card px-3.5 py-3 text-left ${
              selected ? 'shadow-polaroid' : 'shadow-card'
            }`}
            style={{
              borderColor: selected ? accentHex : 'rgba(0, 0, 0, 0.05)',
              transition: `border-color ${MOTION.snappy} ${MOTION.easeOut}, box-shadow ${MOTION.snappy} ${MOTION.easeOut}, background-color ${MOTION.fast} ease`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-medium leading-snug text-ink">
                  {item.title}
                </h3>
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

              <div
                className="relative flex flex-none items-start justify-end overflow-visible"
                style={{
                  width: selected ? 132 : previewUrl ? 40 : 0,
                  minHeight: selected ? 44 : previewUrl ? 36 : 0,
                  transition: `width ${MOTION.snappy} ${MOTION.easeOut}`,
                }}
              >
                {/* Default: square photo preview with count badge at the corner */}
                {!selected && previewUrl && (
                  <div
                    className="relative mt-0.5 h-9 w-9"
                    aria-label={`${photoCount} photo${photoCount === 1 ? '' : 's'}`}
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-md border border-black/10 bg-black/[.04] shadow-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>
                    <span
                      className="absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white"
                      style={{ background: YARN_BRAND.colors.gold }}
                    >
                      {photoCount}
                    </span>
                  </div>
                )}

                {/* Selected: camera / edit / delete fade in (≥44px targets) */}
                <div
                  className={`absolute right-0 top-0 flex items-center ${
                    selected
                      ? 'pointer-events-auto opacity-100'
                      : 'pointer-events-none opacity-0'
                  }`}
                  style={{
                    transition: `opacity ${MOTION.fast} ${MOTION.easeOut}, transform ${MOTION.fast} ${MOTION.easeOut}`,
                    transform: selected ? 'translateX(0)' : 'translateX(6px)',
                  }}
                  aria-hidden={!selected}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemoriesOpen(true);
                    }}
                    aria-label={
                      photoCount > 0 ? `Photos, ${photoCount}` : 'Photos'
                    }
                    tabIndex={selected ? 0 : -1}
                    className="relative flex h-11 w-11 items-center justify-center text-muted hover:text-ink"
                  >
                    <Camera size={16} />
                    {photoCount > 0 && (
                      <span
                        className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-0.5 text-[9px] font-semibold leading-none text-white"
                        style={{ background: YARN_BRAND.colors.gold }}
                      >
                        {photoCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                    aria-label="Edit activity"
                    tabIndex={selected ? 0 : -1}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirming(true);
                    }}
                    aria-label="Delete activity"
                    tabIndex={selected ? 0 : -1}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-saigon"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
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
