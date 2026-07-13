import { YARN_BRAND } from '@/lib/brand/yarn';

/** Small inline yarn-ball mark for headers and UI chrome. */
export default function YarnLogo({
  size = 28,
  color = YARN_BRAND.colors.gold,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={className}
    >
      <g
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="52" cy="44" r="28" />
        <path d="M 26 44 C 32 28, 72 28, 78 44 C 72 60, 32 60, 26 44" />
        <path d="M 52 16 C 68 28, 68 60, 52 72" />
        <path d="M 34 54 C 52 44, 70 54" />
        <path d="M 34 36 C 52 46, 70 36" />
      </g>
      <path
        d="M 24 54 C 14 58, 8 70, 4 82"
        stroke={color}
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
