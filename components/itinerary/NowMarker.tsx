'use client';

import { forwardRef } from 'react';
import { formatClock, parseTimeLabel } from '@/lib/time';

// "You are here" node on today's timeline. Matches the activity rail layout so
// it slots cleanly between cards.
const NowMarker = forwardRef<
  HTMLDivElement,
  { now: Date; accentHex: string; isLast?: boolean }
>(function NowMarker({ now, accentHex, isLast = false }, ref) {
  const label = formatClock(now);
  const time = parseTimeLabel(label);
  const clock = `${time.hour12}:${String(time.minute).padStart(2, '0')}`;

  return (
    <div ref={ref} className="relative flex gap-3" aria-label={`Now, ${label}`}>
      <div className="w-[52px] flex-none pt-0.5 text-right">
        <div className="text-[17px] font-semibold leading-none tracking-tight text-ink">
          {clock}
        </div>
        <div
          className="mt-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: accentHex }}
        >
          {time.period}
        </div>
      </div>

      <div className="relative flex w-3 flex-none flex-col items-center">
        <span
          className="relative mt-1.5 flex h-3 w-3 flex-none items-center justify-center"
          aria-hidden
        >
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-40"
            style={{ background: accentHex }}
          />
          <span
            className="relative h-3 w-3 rounded-full ring-2 ring-cream"
            style={{ background: accentHex }}
          />
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-black/10" aria-hidden />}
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <div
          className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5"
          style={{
            borderColor: `${accentHex}55`,
            background: `color-mix(in srgb, ${accentHex} 14%, #fdfbf5)`,
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: accentHex }}
          >
            Now
          </span>
          <span className="text-[13px] text-muted">You are here</span>
        </div>
      </div>
    </div>
  );
});

export default NowMarker;
