/** Time-column width — dashed rail sits under the clocks (does not pierce them). */
export const TIMELINE_TIME_COL_PX = 40;

/**
 * Matches activity card `py-3` so the start clock lines up with the title.
 */
export const TIMELINE_TIME_PAD_TOP_PX = 12;

/** @deprecated alias — prefer TIMELINE_TIME_PAD_TOP_PX */
export const TIMELINE_NODE_CENTER_Y_PX = TIMELINE_TIME_PAD_TOP_PX + 7;

/** Small clear gap between the clock block and the dashed rail. */
export const TIMELINE_RAIL_GAP_PX = 6;

function dashedRailStyle(accentHex: string): {
  backgroundImage: string;
  opacity: number;
} {
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, ${accentHex} 0 5px, transparent 5px 9px)`,
    opacity: 0.55,
  };
}

/**
 * Dashed yarn below the clocks only — never drawn behind the time text.
 * Extends slightly past the row so consecutive rails meet in the spacing gap.
 */
export function TimelineRailBelow({ accentHex }: { accentHex: string }) {
  return (
    <div
      className="pointer-events-none relative min-h-[8px] w-full flex-1"
      aria-hidden
    >
      <div
        className="absolute left-1/2 w-0.5 -translate-x-1/2"
        style={{
          top: TIMELINE_RAIL_GAP_PX,
          height: `calc(100% + 12px - ${TIMELINE_RAIL_GAP_PX}px)`,
          ...dashedRailStyle(accentHex),
        }}
      />
    </div>
  );
}

/**
 * Full-height dashed rail for rows without clock text (e.g. the now marker).
 */
export function TimelineRail({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 bottom-0"
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2"
        style={{
          height: isLast ? '100%' : 'calc(100% + 12px)',
          ...dashedRailStyle(accentHex),
        }}
      />
    </div>
  );
}

/**
 * Live "now" marker sitting on the dashed rail (ring + inner dot).
 */
export function TimelineNowDot({ accentHex }: { accentHex: string }) {
  return (
    <span
      className="absolute left-1/2 top-1.5 z-10 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-cream"
      style={{ boxShadow: `inset 0 0 0 1.5px ${accentHex}` }}
      aria-hidden
    >
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-30"
        style={{ background: accentHex }}
      />
      <span
        className="relative h-1.5 w-1.5 rounded-full"
        style={{ background: accentHex }}
      />
    </span>
  );
}
