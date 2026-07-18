/** Vertical position of the activity diamond (title-aligned). */
export const TIMELINE_NODE_TOP_PX = 18.75;
export const TIMELINE_NODE_SIZE_PX = 8.5;
export const TIMELINE_NODE_CENTER_Y_PX =
  TIMELINE_NODE_TOP_PX + TIMELINE_NODE_SIZE_PX / 2;

/** Dashed vertical segment from this node into the next title-aligned marker. */
function TimelineSegment({ accentHex }: { accentHex: string }) {
  return (
    <div className="relative min-h-[8px] flex-1">
      <div
        className="absolute left-1/2 top-0 h-[calc(100%+16px)] w-0.5 -translate-x-1/2"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, ${accentHex} 0 5px, transparent 5px 9px)`,
          opacity: 0.55,
        }}
        aria-hidden
      />
    </div>
  );
}

/** Activity marker: compact solid diamond in the city accent. */
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
        className="absolute left-1/2 z-10 -translate-x-1/2 rotate-45 rounded-[1px]"
        style={{
          top: TIMELINE_NODE_TOP_PX,
          width: TIMELINE_NODE_SIZE_PX,
          height: TIMELINE_NODE_SIZE_PX,
          background: accentHex,
        }}
        aria-hidden
      />
      {/* In-flow spacer reserves the node offset so the rail stretches with the row. */}
      <div className="h-[18px] flex-none" aria-hidden />
      {!isLast && <TimelineSegment accentHex={accentHex} />}
    </div>
  );
}

/**
 * Live "now" marker: accent outer ring + solid inner dot on the dashed rail.
 */
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
