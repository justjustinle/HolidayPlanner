/**
 * Timeline geometry: time · gutter · rail (diamond + dashed line) · gutter · card.
 * The diamond is centered in a reserved rail column so it never overlaps the
 * clock or the activity card.
 */

/** Approx clock column for “HH:MM” tabular figures. */
export const TIMELINE_TIME_COL_PX = 36;

/**
 * Rail column width — fits a 9px square rotated 45° (bounding box ≈ 12.7px).
 */
export const TIMELINE_RAIL_COL_PX = 14;

/** Diamond edge length before rotation. */
export const TIMELINE_NODE_SIZE_PX = 9;

/** Horizontal air between time↔rail and rail↔card. */
export const TIMELINE_GUTTER_PX = 10;

/** @deprecated Use TIMELINE_GUTTER_PX — kept for any stray imports. */
export const TIMELINE_TIME_TO_NODE_GAP_PX = TIMELINE_GUTTER_PX;

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
 * Diamond + dashed yarn in a dedicated rail column (no card-edge overhang).
 * Parent row should use `TIMELINE_GUTTER_PX` between time, rail, and card.
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
      className="pointer-events-none relative flex-none self-stretch"
      style={{ width: TIMELINE_RAIL_COL_PX }}
      aria-hidden
    >
      <span
        className="absolute left-1/2 -translate-x-1/2 rotate-45 rounded-[1px]"
        style={{
          top: TIMELINE_NODE_TOP_PX,
          width: TIMELINE_NODE_SIZE_PX,
          height: TIMELINE_NODE_SIZE_PX,
          background: accentHex,
        }}
      />
      {!isLast && (
        <div
          className="absolute left-1/2 w-0.5 -translate-x-1/2"
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

/** @deprecated Prefer TimelineRail — same geometry, old name. */
export const CardEdgeTimeline = TimelineRail;

/** Live “now” ping in the same rail column as activity diamonds. */
export function TimelineNowMarker({
  isLast = false,
  accentHex,
}: {
  isLast?: boolean;
  accentHex: string;
}) {
  return (
    <div
      className="pointer-events-none relative flex-none self-stretch"
      style={{ width: TIMELINE_RAIL_COL_PX }}
      aria-hidden
    >
      <span
        className="absolute left-1/2 top-1.5 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-cream"
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
          className="absolute left-1/2 top-[18px] w-0.5 -translate-x-1/2"
          style={{
            bottom: -6,
            ...dashedRailStyle(accentHex),
          }}
        />
      )}
    </div>
  );
}

/** @deprecated Prefer TimelineNowMarker. */
export const CardEdgeNowMarker = TimelineNowMarker;
