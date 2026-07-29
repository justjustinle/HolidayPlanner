/**
 * Timeline geometry: time hugs a diamond that sits on the card’s left border.
 * The rail lane takes no layout width — diamond + dashed line are absolutely
 * pinned to the card edge so there’s no floating gutter.
 */

/** Approx clock column for “HH:MM” tabular figures. */
export const TIMELINE_TIME_COL_PX = 36;

/** Half-diamond overhang past the card’s left border. */
export const TIMELINE_NODE_SIZE_PX = 9;

/** Matches activity card `py-3`. */
export const TIMELINE_TIME_PAD_TOP_PX = 12;

/**
 * Diamond top so its center meets the title midline
 * (py-3 + half of 15px leading-snug).
 */
export const TIMELINE_NODE_TOP_PX =
  TIMELINE_TIME_PAD_TOP_PX + (15 * 1.375 - TIMELINE_NODE_SIZE_PX) / 2;

export const TIMELINE_NODE_CENTER_Y_PX =
  TIMELINE_NODE_TOP_PX + TIMELINE_NODE_SIZE_PX / 2;

/** Tiny air between the clock and the diamond. */
export const TIMELINE_TIME_TO_NODE_GAP_PX = 6;

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
 * Diamond + dashed yarn pinned to the left edge of the activity card.
 * Parent must be `position: relative` and include the row’s bottom spacing
 * so the dashed segment can bridge into the next diamond.
 */
export function CardEdgeTimeline({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-0"
      aria-hidden
    >
      <span
        className="absolute left-0 -translate-x-1/2 rotate-45 rounded-[1px]"
        style={{
          top: TIMELINE_NODE_TOP_PX,
          width: TIMELINE_NODE_SIZE_PX,
          height: TIMELINE_NODE_SIZE_PX,
          background: accentHex,
        }}
      />
      {!isLast && (
        <div
          className="absolute left-0 w-0.5 -translate-x-1/2"
          style={{
            top: TIMELINE_NODE_CENTER_Y_PX,
            // Stretch through this row’s padding into the next diamond.
            bottom: -6,
            ...dashedRailStyle(accentHex),
          }}
        />
      )}
    </div>
  );
}

/** Live “now” ping pinned the same way as activity diamonds. */
export function CardEdgeNowMarker({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-0"
      aria-hidden
    >
      <span
        className="absolute left-0 top-1.5 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-cream"
        style={{ boxShadow: `inset 0 0 0 1.5px ${accentHex}` }}
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
      {!isLast && (
        <div
          className="absolute left-0 top-[18px] w-0.5 -translate-x-1/2"
          style={{
            bottom: -6,
            ...dashedRailStyle(accentHex),
          }}
        />
      )}
    </div>
  );
}
