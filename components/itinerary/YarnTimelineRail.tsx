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
 * How far the rail extends into the next row — through the next diamond’s
 * center so the join sits under the opaque node.
 */
export const TIMELINE_RAIL_OVERLAP_PX = Math.ceil(TIMELINE_NODE_CENTER_Y_PX);

/** Dash: 5px solid + 4px gap. */
const DASH_SOLID_PX = 5;
const DASH_GAP_PX = 4;
const DASH_PERIOD_PX = DASH_SOLID_PX + DASH_GAP_PX;

/**
 * Keep this much solid (undashed) at each end so the line always plugs into
 * the diamond — never ends on a transparent dash gap.
 * Tall enough that a clear solid stem sits above the next tip.
 */
const TIMELINE_RAIL_SOLID_CAP_PX = DASH_PERIOD_PX * 2;

/** Page surface — matches `.city-tint` (accent wash over cream). */
const CITY_TINT = 'color-mix(in srgb, var(--city-accent) 12%, #f7f1e6)';

function TimelineDash({
  top,
  accentHex,
}: {
  top: number | string;
  accentHex: string;
}) {
  // Opaque muted stroke (mix with cream, not transparent) so gaps can punch
  // cleanly without alpha fringe.
  const stroke = `color-mix(in srgb, ${accentHex} 55%, #f7f1e6)`;
  return (
    <div
      className="absolute left-1/2 w-0.5 -translate-x-1/2"
      style={{
        top,
        bottom: -TIMELINE_RAIL_OVERLAP_PX,
      }}
    >
      {/* Continuous solid backbone — reaches both diamonds with no holes. */}
      <span className="absolute inset-0" style={{ background: stroke }} />
      {/*
        Dash gaps only in the middle. Pattern paints from the bottom up so the
        pixels just above each solid cap are always backbone (never a cream gap).
      */}
      <span
        className="absolute left-0 right-0"
        style={{
          top: TIMELINE_RAIL_SOLID_CAP_PX,
          bottom: TIMELINE_RAIL_SOLID_CAP_PX,
          backgroundImage: `repeating-linear-gradient(to top, transparent 0 ${DASH_SOLID_PX}px, ${CITY_TINT} ${DASH_SOLID_PX}px ${DASH_PERIOD_PX}px)`,
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
        className="absolute left-1/2 z-[1] -translate-x-1/2 rotate-45"
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
