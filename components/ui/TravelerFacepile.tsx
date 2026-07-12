'use client';

import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';

const MAX_VISIBLE = 5;

// Compact overlapping avatars + "n going" — taps open the Who's going sheet.
export default function TravelerFacepile({ onOpen }: { onOpen: () => void }) {
  const { profiles } = useTripData();
  if (profiles.length === 0) return null;

  const visible = profiles.slice(0, MAX_VISIBLE);
  const overflow = profiles.length - visible.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Who's going — ${profiles.length} people`}
      className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-cream-card py-1 pl-1 pr-2.5 text-left shadow-card transition-colors hover:border-black/15 active:bg-black/[.02]"
    >
      <span className="flex items-center" style={{ ['--avatar-ring' as string]: '#fdfbf5' }}>
        {visible.map((p) => (
          <Avatar key={p.id} name={p.name} src={p.avatar_url} size={26} overlap />
        ))}
        {overflow > 0 && (
          <span
            className="inline-flex items-center justify-center rounded-full bg-ink/10 text-[10px] font-semibold text-ink"
            style={{
              width: 26,
              height: 26,
              marginLeft: -6,
              border: '1.5px solid #fdfbf5',
              boxSizing: 'border-box',
            }}
          >
            +{overflow}
          </span>
        )}
      </span>
      <span className="text-[12px] font-medium text-muted">
        {profiles.length} going
      </span>
    </button>
  );
}
