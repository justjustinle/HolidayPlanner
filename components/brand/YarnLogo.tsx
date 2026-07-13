import { YARN_ICON } from '@/lib/brand/yarn-icon';
import { YARN_DEFAULT_ACCENT } from '@/lib/brand/setYarnFavicon';

/**
 * Crop around the ball + loose end so the mark fills the box.
 * Sized in `em` by default so it tracks the parent header text.
 */
const INLINE_VIEWBOX = '55 88 205 155';
const INLINE_ASPECT = 205 / 155;

/** Inline yarn-ball mark from the proposed SVG (single filled path). */
export default function YarnLogo({
  /** Pixel height. Omit to size with the parent font (`1.15em`). */
  size,
  color = YARN_DEFAULT_ACCENT,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  // 1em = parent font-size so the mark matches the wordmark height.
  const em = 1;

  return (
    <svg
      width={size != null ? Math.round(size * INLINE_ASPECT) : undefined}
      height={size}
      viewBox={INLINE_VIEWBOX}
      fill="none"
      aria-hidden
      className={['inline-block shrink-0 align-middle', className]
        .filter(Boolean)
        .join(' ')}
      style={
        size == null
          ? { width: `${INLINE_ASPECT * em}em`, height: `${em}em` }
          : undefined
      }
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
