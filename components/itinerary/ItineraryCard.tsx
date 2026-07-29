'use client';

import { useMemo, useRef, useState } from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import ViewActivitySheet from './ViewActivitySheet';
import {
  TIMELINE_TIME_COL_PX,
  TIMELINE_TIME_PAD_TOP_PX,
  TimelineRail,
} from './YarnTimelineRail';
import {
  useCardLongPress,
  type ReorderArmDetail,
} from './reorderGestures';
import { useTripData } from '../TripDataProvider';
import { YARN_BRAND } from '@/lib/brand/yarn';
import { hapticLight, MOTION } from '@/lib/motion';
import { formatTimeLabel } from '@/lib/time';
import type { ItineraryItem } from '@/lib/types';

/** Start-time type size — keep in sync with the clock style below. */
const START_TIME_FONT_PX = 17 * 0.85; // ~14.45px

export default function ItineraryCard({
  item,
  accentHex,
  isLast = false,
  dimmed = false,
  /** Extra space after this row (capped time-gap between activities). */
  spacingAfter = 16,
  reorderEnabled = false,
  isDragSource = false,
  /** Preview clocks while this card is the drag source (ghost owns the live time). */
  onReorderArm,
}: {
  item: ItineraryItem;
  accentHex: string;
  isLast?: boolean;
  dimmed?: boolean;
  spacingAfter?: number;
  reorderEnabled?: boolean;
  isDragSource?: boolean;
  onReorderArm?: (detail: ReorderArmDetail) => void;
}) {
  const { photos } = useTripData();
  const [viewing, setViewing] = useState(false);
  const suppressClickRef = useRef(false);
  const draggingRef = useRef(isDragSource);
  draggingRef.current = isDragSource;

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

  const openView = () => {
    if (isDragSource) return;
    hapticLight();
    setViewing(true);
  };

  const longPress = useCardLongPress({
    enabled: reorderEnabled && Boolean(onReorderArm),
    itemId: item.id,
    suppressedRef: suppressClickRef,
    draggingRef,
    onArm: (detail) => {
      suppressClickRef.current = true;
      onReorderArm?.(detail);
    },
  });

  return (
    <>
      <div
        data-activity-row={item.id}
        className={`reorder-surface relative flex items-stretch gap-1.5 transition-opacity ${
          dimmed && !isDragSource ? 'opacity-45' : ''
        } ${isDragSource ? 'opacity-35' : ''}`}
      >
        {/* Time column — dashed rail runs through the clocks; no diamond nodes */}
        <div
          className="relative flex-none self-stretch text-center tabular-nums"
          style={{ width: TIMELINE_TIME_COL_PX }}
        >
          <TimelineRail isLast={isLast} accentHex={accentHex} />
          <div
            className="relative z-[1]"
            style={{ paddingTop: TIMELINE_TIME_PAD_TOP_PX }}
          >
            <div
              className="font-semibold leading-none tracking-tight text-ink"
              style={{ fontSize: START_TIME_FONT_PX }}
            >
              {startClock}
            </div>
            {endClock && (
              <div className="mt-1 text-[10px] font-medium leading-tight tracking-tight text-muted">
                <div className="text-[8px] font-semibold uppercase tracking-wider">
                  to
                </div>
                <div>{endClock}</div>
              </div>
            )}
          </div>
        </div>

        {/* Activity card — tap opens View activity; hold to reorder */}
        <div
          className="min-w-0 flex-1"
          style={{ paddingBottom: isLast ? 8 : spacingAfter }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={openView}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openView();
              }
            }}
            onPointerDown={longPress.onPointerDown}
            onPointerMove={longPress.onPointerMove}
            onPointerUp={longPress.onPointerUp}
            onPointerCancel={longPress.onPointerCancel}
            onClickCapture={longPress.onClickCapture}
            onContextMenu={longPress.onContextMenu}
            className="reorder-surface cursor-pointer select-none rounded-xl border border-black/5 bg-cream-card px-3.5 py-3 text-left shadow-card transition-shadow"
            style={{
              transition: `box-shadow ${MOTION.snappy} ${MOTION.easeOut}`,
              // Allow vertical page scroll until long-press arms; then JS sets none.
              touchAction: isDragSource ? 'none' : 'pan-y',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-medium leading-snug text-ink">
                  {item.title}
                </h3>
                {item.location && (
                  <p className="mt-1 inline-flex max-w-full items-center gap-1 text-[12px] text-muted">
                    <MapPin size={12} className="flex-none" />
                    <span className="truncate">{item.location}</span>
                  </p>
                )}
                {item.notes && (
                  <div className="mt-1.5 flex max-w-full items-start gap-1 rounded-md bg-black/[.04] px-1.5 py-1">
                    <MessageCircle
                      size={12}
                      className="mt-0.5 flex-none text-muted"
                      aria-hidden
                    />
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-[12px] italic leading-snug text-muted">
                      {item.notes}
                    </p>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div
                  className="relative mt-0.5 h-9 w-9 flex-none"
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
            </div>
          </div>
        </div>
      </div>

      {viewing && !isDragSource && (
        <ViewActivitySheet item={item} onClose={() => setViewing(false)} />
      )}
    </>
  );
}

/** Floating card clone shown under the finger while reordering. */
export function ItineraryDragGhost({
  item,
  accentHex,
  timeLabel,
  endTimeLabel,
  left,
  width,
  top,
}: {
  item: ItineraryItem;
  accentHex: string;
  timeLabel: string;
  endTimeLabel: string | null;
  left: number;
  width: number;
  top: number;
}) {
  const startClock = formatTimeLabel(timeLabel);
  const endClock = endTimeLabel ? formatTimeLabel(endTimeLabel) : null;

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left,
        top,
        width,
        transform: 'scale(1.03)',
        filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.18))',
      }}
      aria-hidden
    >
      <div
        className="rounded-xl border bg-cream-card px-3.5 py-3"
        style={{ borderColor: accentHex }}
      >
        <div className="mb-1.5 flex items-baseline gap-2 tabular-nums">
          <span
            className="text-[13px] font-semibold text-ink"
            style={{ color: accentHex }}
          >
            {startClock}
          </span>
          {endClock && (
            <span className="text-[11px] font-medium text-muted">
              <span className="text-[9px] font-semibold uppercase tracking-wider">
                TO
              </span>{' '}
              {endClock}
            </span>
          )}
        </div>
        <h3 className="text-[15px] font-medium leading-snug text-ink">
          {item.title}
        </h3>
        {item.location && (
          <p className="mt-1 truncate text-[12px] text-muted">{item.location}</p>
        )}
      </div>
    </div>
  );
}
