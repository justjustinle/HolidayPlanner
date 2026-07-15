/** Dashed vertical segment from this node into the next (overlaps the 6px inset). */
function TimelineSegment() {
  return (
    <div className="relative min-h-[8px] flex-1">
      <div
        className="absolute left-1/2 top-0 h-[calc(100%+6px)] w-0 -translate-x-1/2 border-l-[1.5px] border-dashed border-ink/35"
        aria-hidden
      />
    </div>
  );
}

/**
 * Activity marker: accent outer ring + solid inner dot (city colour).
 * Sits on the dashed timeline rail.
 */
export function YarnTimelineNode({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div className="relative flex w-5 flex-none flex-col self-stretch">
      <span
        className="absolute left-1/2 top-1.5 z-10 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-cream"
        style={{ boxShadow: `inset 0 0 0 1.5px ${accentHex}` }}
        aria-hidden
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accentHex }}
        />
      </span>
      {/* In-flow spacer reserves the node offset so the rail stretches with the row. */}
      <div className="h-[18px] flex-none" aria-hidden />
      {!isLast && <TimelineSegment />}
    </div>
  );
}

/** Solid diamond on the dashed rail for the live "now" marker. */
export function YarnTimelineNowNode({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div className="relative flex w-5 flex-none flex-col self-stretch">
      <span
        className="absolute left-1/2 top-2 z-10 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[1px]"
        style={{ background: accentHex }}
        aria-hidden
      />
      <div className="h-[18px] flex-none" aria-hidden />
      {!isLast && <TimelineSegment />}
    </div>
  );
}
