import { YARN_ICON } from '@/lib/brand/yarn-icon';
import { YARN_DEFAULT_ACCENT } from '@/lib/brand/setYarnFavicon';

/** Small inline yarn-ball mark for headers and UI chrome. */
export default function YarnLogo({
  size = 28,
  color = YARN_DEFAULT_ACCENT,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const { stroke, strandStroke } = YARN_ICON;

  return (
    <svg
      width={size}
      height={size}
      viewBox={YARN_ICON.viewBox}
      fill="none"
      aria-hidden
      className={className}
    >
      <g
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={YARN_ICON.cx} cy={YARN_ICON.cy} r={YARN_ICON.r} />
        {YARN_ICON.ballPaths
          .filter((p) => p.type === 'path')
          .map((p) => (
            <path key={p.d} d={p.d} />
          ))}
      </g>
      <path
        d={YARN_ICON.strand.d}
        stroke={color}
        strokeWidth={strandStroke}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
