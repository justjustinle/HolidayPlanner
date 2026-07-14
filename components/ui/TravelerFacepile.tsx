'use client';

import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';

const MAX_VISIBLE = 5;

// Side-by-side avatars (small gap, no overlap) — opens the roster.
// Parent supplies the Users icon in the trip-header 40px rail.
export default function TravelerFacepile({
  onOpen,
  size = 26,
}: {
  onOpen: () => void;
  size?: number;
}) {
  const { profiles } = useTripData();
  if (profiles.length === 0) return null;

  const visible = profiles.slice(0, MAX_VISIBLE);
  const overflow = profiles.length - visible.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Who's going — ${profiles.length} people`}
      className="flex items-center gap-1 py-0.5 text-left transition-opacity hover:opacity-80 active:opacity-70"
    >
      {visible.map((p) => (
        <Avatar key={p.id} name={p.name} src={p.avatar_url} size={size} />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-ink/10 text-[10px] font-semibold text-ink"
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </button>
  );
}
