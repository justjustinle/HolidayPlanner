import { YARN_ICON } from '@/lib/brand/yarn-icon';
import { YARN_DEFAULT_ACCENT } from '@/lib/brand/setYarnFavicon';

/** Inline yarn-ball mark from the proposed SVG (single filled path). */
export default function YarnLogo({
  /** Pixel height. Omit to size with the parent font. */
  size,
  color = YARN_DEFAULT_ACCENT,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const aspect = YARN_ICON.displayWidth / YARN_ICON.displayHeight;
  // Open linework reads smaller than solid serif caps; size up for optical match.
  const em = 1.22;

  return (
    <svg
      width={size != null ? Math.round(size * aspect) : undefined}
      height={size}
      viewBox={YARN_ICON.displayViewBox}
      fill="none"
      aria-hidden
      className={['block shrink-0', className].filter(Boolean).join(' ')}
      style={
        size == null
          ? {
              width: `${aspect * em}em`,
              height: `${em}em`,
            }
          : undefined
      }
    >
      <path d={YARN_ICON.path} fill={color} fillRule="evenodd" />
    </svg>
  );
}
