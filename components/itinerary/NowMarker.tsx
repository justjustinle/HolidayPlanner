'use client';

import { forwardRef } from 'react';
import { formatClock } from '@/lib/time';
import { YarnTimelineNowNode } from './YarnTimelineRail';

// Minimal live position marker. Empty side columns preserve the activity-row
// geometry while leaving only the flashing circle visible.
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
      className="relative flex items-stretch gap-3"
      aria-label={`Current time, ${clock}`}
    >
      <div className="w-[56px] flex-none" aria-hidden />

      <YarnTimelineNowNode isLast={isLast} accentHex={accentHex} />

      <div
        className="min-h-5 min-w-0 flex-1"
        style={{ paddingBottom: isLast ? 8 : spacingAfter }}
        aria-hidden
      />
    </div>
  );
});

export default NowMarker;
