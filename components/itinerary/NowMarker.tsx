'use client';

import { forwardRef } from 'react';
import { formatClock } from '@/lib/time';
import {
  TIMELINE_CARD_OVERLAP_PX,
  TIMELINE_TIME_COL_PX,
  YarnTimelineNowNode,
} from './YarnTimelineRail';

// Minimal live position marker — same time + rail geometry as activity rows.
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
      className="relative flex items-stretch gap-0"
      aria-label={`Current time, ${clock}`}
    >
      <div
        className="relative flex-none self-stretch"
        style={{ width: TIMELINE_TIME_COL_PX }}
        aria-hidden
      />

      <div
        className="relative z-10 flex-none self-stretch"
        style={{ marginRight: -TIMELINE_CARD_OVERLAP_PX }}
        aria-hidden
      >
        <YarnTimelineNowNode isLast={isLast} accentHex={accentHex} />
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
