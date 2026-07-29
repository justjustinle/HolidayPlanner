/** Clock column — right-aligned so times hug the diamond rail. */
export const TIMELINE_TIME_COL_PX = 38;

/** Narrow rail lane; diamonds sit almost on the card’s left edge. */
export const TIMELINE_RAIL_COL_PX = 12;

/** Pull the card left so the diamond overlaps the card border slightly. */
export const TIMELINE_CARD_OVERLAP_PX = 6;

/**
 * Matches activity card `py-3`. Prefer sharing the `py-3` class on the clock
 * block rather than hard-coding this elsewhere.
 */
export const TIMELINE_TIME_PAD_TOP_PX = 12;

/** Diamond size — compact bullet attached to the card. */
export const TIMELINE_NODE_SIZE_PX = 8;

/**
 * Top of the diamond so its center lines up with the activity title
 * (py-3 + half of 15px leading-snug line ≈ 12 + 10.3).
 */
export const TIMELINE_NODE_TOP_PX =
  TIMELINE_TIME_PAD_TOP_PX + (15 * 1.375 - TIMELINE_NODE_SIZE_PX) / 2;

export const TIMELINE_NODE_CENTER_Y_PX =
  TIMELINE_NODE_TOP_PX + TIMELINE_NODE_SIZE_PX / 2;

function dashedRailStyle(accentHex: string): {
  backgroundImage: string;
  opacity: number;
} {
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, ${accentHex} 0 5px, transparent 5px 9px)`,
    opacity: 0.55,
  };
}

/** Dashed vertical segment from this node into the next title-aligned marker. */
function TimelineSegment({ accentHex }: { accentHex: string }) {
  return (
    <div className="relative min-h-[8px] flex-1">
      <div
        className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2"
        style={{
          // Bridge into the next diamond (accounts for node inset + row gap).
          height: 'calc(100% + 14px)',
          ...dashedRailStyle(accentHex),
        }}
        aria-hidden
      />
    </div>
  );
}

/** Activity marker: compact solid diamond on the dashed rail, flush to the card. */
export function YarnTimelineNode({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div
      className="relative flex flex-none flex-col self-stretch"
      style={{ width: TIMELINE_RAIL_COL_PX }}
    >
      <span
        className="absolute left-1/2 z-10 -translate-x-1/2 rotate-45 rounded-[1px]"
        style={{
          top: TIMELINE_NODE_TOP_PX,
          width: TIMELINE_NODE_SIZE_PX,
          height: TIMELINE_NODE_SIZE_PX,
          background: accentHex,
        }}
        aria-hidden
      />
      {/* In-flow spacer so the rail stretches with the row. */}
      <div
        className="flex-none"
        style={{ height: TIMELINE_NODE_TOP_PX + TIMELINE_NODE_SIZE_PX / 2 }}
        aria-hidden
      />
      {!isLast && <TimelineSegment accentHex={accentHex} />}
    </div>
  );
}

/**
 * Live "now" marker: accent ring + inner dot on the same rail lane as diamonds.
 */
export function YarnTimelineNowNode({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div
      className="relative flex flex-none flex-col self-stretch"
      style={{ width: TIMELINE_RAIL_COL_PX }}
    >
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
      <div className="h-[18px] flex-none" aria-hidden />
      {!isLast && <TimelineSegment accentHex={accentHex} />}
    </div>
  );
}
