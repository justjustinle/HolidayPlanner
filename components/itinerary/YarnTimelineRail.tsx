/** Time-column width — dashed rail runs through the center of the clocks. */
export const TIMELINE_TIME_COL_PX = 48;

/** Vertical align of the start clock with the activity card title. */
export const TIMELINE_TIME_PAD_TOP_PX = 12;

/** @deprecated kept for any lingering imports — same as TIMELINE_TIME_PAD_TOP_PX + half line */
export const TIMELINE_NODE_CENTER_Y_PX = TIMELINE_TIME_PAD_TOP_PX + 7;

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
 * Dashed yarn rail drawn through the time column (no diamond nodes).
 * Extends slightly past the row so consecutive rails meet without a gap.
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
