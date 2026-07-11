import { avatarColor, initialOf } from '@/lib/avatar';

export default function Avatar({
  name,
  size = 22,
  overlap = false,
  dim = false,
  ring = false,
}: {
  name: string;
  size?: number;
  overlap?: boolean;
  dim?: boolean;
  ring?: boolean;
}) {
  const color = avatarColor(name);
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: color,
        opacity: dim ? 0.3 : 1,
        marginRight: overlap ? -6 : undefined,
        border: overlap
          ? '1.5px solid var(--avatar-ring, #fdfbf5)'
          : ring
            ? `2px solid ${color}`
            : '2px solid transparent',
        boxSizing: 'border-box',
      }}
      className="inline-flex flex-none items-center justify-center rounded-full font-medium text-white"
    >
      {initialOf(name)}
    </span>
  );
}
