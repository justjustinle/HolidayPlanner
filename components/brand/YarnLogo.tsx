import { YARN_ICON } from '@/lib/brand/yarn-icon';
import { YARN_DEFAULT_ACCENT } from '@/lib/brand/setYarnFavicon';

/** Inline yarn-ball mark from the proposed SVG (single filled path). */
export default function YarnLogo({
  size = 28,
  color = YARN_DEFAULT_ACCENT,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  // Preserve artboard aspect (328×308) so the mark isn't squashed.
  const height = Math.round((size * YARN_ICON.height) / YARN_ICON.width);

  return (
    <svg
      width={size}
      height={height}
      viewBox={YARN_ICON.viewBox}
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d={YARN_ICON.path}
        fill={color}
        fillRule="evenodd"
        stroke={color}
        strokeWidth={0.25}
        strokeLinejoin="round"
      />
    </svg>
  );
}
