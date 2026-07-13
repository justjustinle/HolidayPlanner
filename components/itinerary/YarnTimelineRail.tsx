/** Wavy thread segment between timeline nodes.
 *  Must fill the full row height (no max-height) so the yarn meets the next
 *  node — capping it left a visible gap when cards/spacing were taller. */
function YarnThreadSegment({ accentHex }: { accentHex: string }) {
  return (
    <svg
      className="-mb-1.5 min-h-[20px] w-4 flex-1"
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
    <div className="relative flex w-5 flex-none flex-col items-center self-stretch">
      <span
        className="mt-1.5 box-border h-3 w-3 flex-none rounded-full bg-cream"
        style={{ border: `2.5px solid ${accentHex}` }}
        aria-hidden
      />
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
    <div className="relative flex w-5 flex-none flex-col items-center self-stretch">
      <span
        className="relative mt-1.5 flex h-3.5 w-3.5 flex-none items-center justify-center"
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
      {!isLast && <YarnThreadSegment accentHex={accentHex} />}
    </div>
  );
}
