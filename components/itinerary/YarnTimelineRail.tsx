import { YARN_BRAND } from '@/lib/brand/yarn';

const YARN_GOLD = YARN_BRAND.colors.gold;

/** Wavy gold thread segment between timeline nodes. */
function YarnThreadSegment() {
  return (
    <svg
      className="mt-0.5 min-h-[20px] w-4 flex-1"
      preserveAspectRatio="none"
      viewBox="0 0 16 100"
      aria-hidden
    >
      <path
        d="M 8 0 C 3 18, 13 36, 8 54 C 3 72, 13 90, 8 100"
        stroke={YARN_GOLD}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Hollow gold ring — matches the reference yarn-thread day nodes. */
export function YarnTimelineNode({ isLast = false }: { isLast?: boolean }) {
  return (
    <div className="relative flex w-5 flex-none flex-col items-center">
      <span
        className="mt-1.5 box-border h-3 w-3 flex-none rounded-full bg-cream"
        style={{ border: `2.5px solid ${YARN_GOLD}` }}
        aria-hidden
      />
      {!isLast && <YarnThreadSegment />}
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
    <div className="relative flex w-5 flex-none flex-col items-center">
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
      {!isLast && <YarnThreadSegment />}
    </div>
  );
}
