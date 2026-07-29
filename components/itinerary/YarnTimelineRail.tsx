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

/** Half the diamond’s vertical tip-to-tip span after 45° rotation. */
const DIAMOND_HALF_DIAG_PX = (TIMELINE_NODE_SIZE_PX * Math.SQRT2) / 2;

/**
 * Visual top tip of the next diamond, relative to its row top.
 * (`top` + rotate-45 around center) — the tip sits above the unrotated box.
 */
const TIMELINE_DIAMOND_TIP_Y_PX =
  TIMELINE_NODE_CENTER_Y_PX - DIAMOND_HALF_DIAG_PX;

/**
 * How far the rail extends into the next row: a couple of px past the next
 * diamond’s visual tip so the dash tucks under the node (no hairline gap).
 */
export const TIMELINE_RAIL_OVERLAP_PX = Math.ceil(TIMELINE_DIAMOND_TIP_Y_PX) + 2;

/** Dash: 5px solid + 4px gap. */
const DASH_SOLID_PX = 5;
const DASH_GAP_PX = 4;
const DASH_PERIOD_PX = DASH_SOLID_PX + DASH_GAP_PX;

function TimelineDash({
  top,
  accentHex,
}: {
  top: number | string;
  accentHex: string;
}) {
  const stroke = `color-mix(in srgb, ${accentHex} 55%, transparent)`;
  return (
    <div
      className="absolute left-1/2 w-0.5 -translate-x-1/2"
      style={{
        top,
        bottom: -TIMELINE_RAIL_OVERLAP_PX,
        /*
          Paint from the bottom up so the pixels at the next diamond tip are
          always the solid part of the dash — never a transparent gap.
        */
        backgroundImage: `repeating-linear-gradient(to top, ${stroke} 0 ${DASH_SOLID_PX}px, transparent ${DASH_SOLID_PX}px ${DASH_PERIOD_PX}px)`,
      }}
    >
      {/*
        Short solid stub through the tip (covers AA / subpixel rounding).
        Kept shorter than one dash period so the rail still reads as dashed.
      */}
      <span
        className="absolute left-0 right-0"
        style={{
          bottom: 0,
          height: Math.ceil(DIAMOND_HALF_DIAG_PX) + 2,
          background: stroke,
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
      {!isLast && (
        <TimelineDash
          // From diamond center — node paints over the upper join.
          top={TIMELINE_NODE_CENTER_Y_PX}
          accentHex={accentHex}
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
