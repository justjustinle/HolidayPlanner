'use client';

import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';

const MAX_VISIBLE = 5;

// Overlapping traveler avatars — opens the roster. Flags live in the trip
// title now so this is faces only.
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
  const overlap = Math.round(size * 0.32);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Who's going — ${profiles.length} people`}
      className="flex items-center py-0.5 text-left transition-opacity hover:opacity-80 active:opacity-70"
    >
      <span className="flex items-center">
        {visible.map((p, i) => (
          <span
            key={p.id}
            className="relative rounded-full ring-2 ring-cream"
            style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: i + 1 }}
          >
            <Avatar name={p.name} src={p.avatar_url} size={size} />
          </span>
        ))}
        {overflow > 0 && (
          <span
            className="relative inline-flex items-center justify-center rounded-full bg-ink/10 text-[10px] font-semibold text-ink ring-2 ring-cream"
            style={{
              marginLeft: -overlap,
              zIndex: visible.length + 1,
              width: size,
              height: size,
            }}
          >
            +{overflow}
          </span>
        )}
      </span>
    </button>
  );
}
