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
export const TIMELINE_GUTTER_PX = 14;

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

/**
 * How far the dashed segment extends into the next row so it meets the next
 * diamond (tucks under its center — closes the hairline gap above the tip).
 */
export const TIMELINE_RAIL_OVERLAP_PX = Math.ceil(TIMELINE_NODE_CENTER_Y_PX);

/** Solid tip so a transparent dash gap never opens above the next diamond. */
const TIMELINE_RAIL_JOIN_PX = 18;

function dashedRailStyle(accentHex: string): {
  backgroundImage: string;
  opacity: number;
} {
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, ${accentHex} 0 5px, transparent 5px 9px)`,
    opacity: 0.55,
  };
}

function TimelineDash({
  top,
  accentHex,
}: {
  top: number | string;
  accentHex: string;
}) {
  return (
    <div
      className="absolute left-1/2 w-0.5 -translate-x-1/2"
      style={{
        top,
        bottom: -TIMELINE_RAIL_OVERLAP_PX,
        ...dashedRailStyle(accentHex),
      }}
    >
      {/* Solid caps so transparent dash gaps never open at either diamond. */}
      <span
        className="absolute left-0 right-0 top-0"
        style={{
          height: TIMELINE_RAIL_JOIN_PX,
          background: accentHex,
        }}
      />
      <span
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: TIMELINE_RAIL_JOIN_PX,
          background: accentHex,
        }}
      />
    </div>
  );
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
        className="absolute left-1/2 z-[1] -translate-x-1/2 rotate-45 rounded-[1px]"
        style={{
          top: TIMELINE_NODE_TOP_PX,
          width: TIMELINE_NODE_SIZE_PX,
          height: TIMELINE_NODE_SIZE_PX,
          background: accentHex,
        }}
      />
      {!isLast && <TimelineDash top={TIMELINE_NODE_CENTER_Y_PX} accentHex={accentHex} />}
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
        className="absolute left-1/2 top-1.5 z-[1] flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-cream"
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
      {!isLast && <TimelineDash top={18} accentHex={accentHex} />}
    </div>
  );
}

/** @deprecated Prefer TimelineNowMarker. */
export const CardEdgeNowMarker = TimelineNowMarker;
