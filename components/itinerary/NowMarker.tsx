'use client';

import { forwardRef } from 'react';
import { formatClock } from '@/lib/time';
import {
  TIMELINE_GUTTER_PX,
  TIMELINE_TIME_COL_PX,
  TimelineNowMarker,
} from './YarnTimelineRail';

// Same time + rail + card geometry as activity rows.
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
      className="relative flex items-stretch"
      style={{ gap: TIMELINE_GUTTER_PX }}
      aria-label={`Current time, ${clock}`}
    >
      <div
        className="relative flex-none self-stretch"
        style={{ width: TIMELINE_TIME_COL_PX }}
        aria-hidden
      />

      <TimelineNowMarker isLast={isLast} accentHex={accentHex} />

      <div
        className="relative min-h-5 min-w-0 flex-1"
        style={{ paddingBottom: isLast ? 8 : spacingAfter }}
        aria-hidden
      />
    </div>
  );
});

export default NowMarker;
