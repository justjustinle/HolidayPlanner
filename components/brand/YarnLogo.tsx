import { YARN_ICON } from '@/lib/brand/yarn-icon';
import { YARN_DEFAULT_ACCENT } from '@/lib/brand/setYarnFavicon';

/** Inline yarn-ball mark from the proposed SVG (single filled path). */
export default function YarnLogo({
  /** Pixel height. Omit to size with the parent font (`1em` = cap height). */
  size,
  color = YARN_DEFAULT_ACCENT,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const aspect = YARN_ICON.displayWidth / YARN_ICON.displayHeight;
  // Match serif title cap height; tiny optical lift vs geometric center.
  const em = 1;

  return (
    <svg
      width={size != null ? Math.round(size * aspect) : undefined}
      height={size}
      viewBox={YARN_ICON.displayViewBox}
      fill="none"
      aria-hidden
      className={['block shrink-0 self-center', className].filter(Boolean).join(' ')}
      style={
        size == null
          ? {
              width: `${aspect * em}em`,
              height: `${em}em`,
              // Serif caps read slightly high; nudge mark up to sit on the line.
              transform: 'translateY(-0.04em)',
            }
          : undefined
      }
    >
      <path d={YARN_ICON.path} fill={color} fillRule="evenodd" />
    </svg>
  );
}
