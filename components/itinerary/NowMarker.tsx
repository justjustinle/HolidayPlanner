'use client';

import { forwardRef } from 'react';
import { formatClock } from '@/lib/time';
import {
  TIMELINE_TIME_COL_PX,
  TIMELINE_TIME_TO_NODE_GAP_PX,
  CardEdgeNowMarker,
} from './YarnTimelineRail';

// Same time + card-edge rail geometry as activity rows.
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
      style={{ gap: TIMELINE_TIME_TO_NODE_GAP_PX }}
      aria-label={`Current time, ${clock}`}
    >
      <div
        className="relative flex-none self-stretch"
        style={{ width: TIMELINE_TIME_COL_PX }}
        aria-hidden
      />

      <div
        className="relative min-h-5 min-w-0 flex-1"
        style={{ paddingBottom: isLast ? 8 : spacingAfter }}
        aria-hidden
      >
        <CardEdgeNowMarker isLast={isLast} accentHex={accentHex} />
      </div>
    </div>
  );
});

export default NowMarker;
