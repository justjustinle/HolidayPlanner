/** Wavy thread from this row's node down into the next — overlaps the 6px node inset. */
function YarnThreadSegment({ accentHex }: { accentHex: string }) {
  return (
    <div className="relative min-h-[8px] flex-1">
      <div className="absolute left-1/2 top-0 h-[calc(100%+6px)] w-4 -translate-x-1/2">
        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 16 100"
          aria-hidden
        >
          <path
            d="M 8 0 C 3 18, 13 36, 8 54 C 3 72, 13 90, 8 100"
            stroke={accentHex}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

/** Hollow ring on the yarn thread — one per activity. */
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
        className="absolute left-1/2 top-1.5 z-10 box-border h-3 w-3 -translate-x-1/2 rounded-full bg-cream"
        style={{ border: `2.5px solid ${accentHex}` }}
        aria-hidden
      />
      {/* In-flow spacer reserves the node offset so the rail stretches with the row. */}
      <div className="h-[18px] flex-none" aria-hidden />
      {!isLast && <YarnThreadSegment accentHex={accentHex} />}
    </div>
  );
}

/** Pulsing filled node for the live "now" marker on the yarn thread. */
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
        className="absolute left-1/2 top-1.5 z-10 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center"
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
      <div className="h-[18px] flex-none" aria-hidden />
      {!isLast && <YarnThreadSegment accentHex={accentHex} />}
    </div>
  );
}
