import { avatarColor, initialOf } from '@/lib/avatar';

// A circular person avatar. Renders their uploaded photo when `src` is set,
// otherwise a colored initial derived from their name.
export default function Avatar({
  name,
  src,
  size = 22,
  overlap = false,
  dim = false,
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  overlap?: boolean;
  dim?: boolean;
  ring?: boolean;
}) {
  const color = avatarColor(name);
  const shared: React.CSSProperties = {
    width: size,
    height: size,
    opacity: dim ? 0.3 : 1,
    marginRight: overlap ? -6 : undefined,
    border: overlap
      ? '1.5px solid var(--avatar-ring, #fdfbf5)'
      : ring
        ? `2px solid ${color}`
        : '2px solid transparent',
    boxSizing: 'border-box',
    flex: 'none',
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        title={name}
        style={shared}
        className="inline-block rounded-full object-cover"
      />
    );
  }

  return (
    <span
      title={name}
      style={{ ...shared, background: color, fontSize: size * 0.44 }}
      className="inline-flex items-center justify-center rounded-full font-medium text-white"
    >
      {initialOf(name)}
    </span>
  );
}
