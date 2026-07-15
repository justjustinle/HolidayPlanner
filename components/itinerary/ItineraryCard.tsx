'use client';

import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import ViewActivitySheet from './ViewActivitySheet';
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
  /** Extra space after this row (capped time-gap between activities). */
  spacingAfter = 16,
}: {
  item: ItineraryItem;
  accentHex: string;
  isLast?: boolean;
  dimmed?: boolean;
  spacingAfter?: number;
}) {
  const { photos } = useTripData();
  const [viewing, setViewing] = useState(false);

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
    hapticLight();
    setViewing(true);
  };

  return (
    <>
      <div
        className={`relative flex items-stretch gap-3 transition-opacity ${dimmed ? 'opacity-45' : ''}`}
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

        <YarnTimelineNode isLast={isLast} accentHex={accentHex} />

        {/* Activity card — tap opens View activity sheet */}
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
            className="cursor-pointer rounded-xl border border-black/5 bg-cream-card px-3.5 py-3 text-left shadow-card transition-shadow"
            style={{
              transition: `box-shadow ${MOTION.snappy} ${MOTION.easeOut}`,
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

      {viewing && (
        <ViewActivitySheet item={item} onClose={() => setViewing(false)} />
      )}
    </>
  );
}
