'use client';

import { forwardRef } from 'react';
import { formatClock } from '@/lib/time';
import {
  TIMELINE_TIME_COL_PX,
  TimelineNowDot,
  TimelineRail,
} from './YarnTimelineRail';

// Minimal live position marker. Time column keeps the dashed rail geometry;
// only the flashing circle is visible on the rail.
const NowMarker = forwardRef<
  HTMLDivElement,
  {
    now: Date;
    accentHex: string;
    isLast?: boolean;
    spacingAfter?: number;
  }
>(function NowMarker(
  { now, accentHex, isLast = false, spacingAfter = 16 },
  ref
) {
  const clock = formatClock(now);

  return (
    <div
      ref={ref}
      className="relative flex items-stretch gap-2"
      aria-label={`Current time, ${clock}`}
    >
      <div
        className="relative flex-none self-stretch"
        style={{ width: TIMELINE_TIME_COL_PX }}
        aria-hidden
      >
        <TimelineRail isLast={isLast} accentHex={accentHex} />
        <TimelineNowDot accentHex={accentHex} />
      </div>

      <div
        className="min-h-5 min-w-0 flex-1"
        style={{ paddingBottom: isLast ? 8 : spacingAfter }}
        aria-hidden
      />
    </div>
  );
});

export default NowMarker;
