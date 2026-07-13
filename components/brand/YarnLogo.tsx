import { YARN_ICON } from '@/lib/brand/yarn-icon';
import { YARN_DEFAULT_ACCENT } from '@/lib/brand/setYarnFavicon';

/** Inline yarn-ball mark from the proposed SVG (single filled path). */
export default function YarnLogo({
  /** Pixel height. Omit to size with the parent font (`1em`). */
  size,
  color = YARN_DEFAULT_ACCENT,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const aspect = YARN_ICON.width / YARN_ICON.height;
  const em = 1;

  return (
    <svg
      width={size != null ? Math.round(size * aspect) : undefined}
      height={size}
      viewBox={YARN_ICON.viewBox}
      fill="none"
      aria-hidden
      className={['inline-block shrink-0 align-middle', className]
        .filter(Boolean)
        .join(' ')}
      style={
        size == null
          ? { width: `${aspect * em}em`, height: `${em}em` }
          : undefined
      }
    >
      <path d={YARN_ICON.path} fill={color} fillRule="evenodd" />
    </svg>
  );
}
