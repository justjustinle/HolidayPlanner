'use client';

import { Users } from 'lucide-react';
import Avatar from './Avatar';
import { ThaiFlag, VietnamFlag } from './Flag';
import { useTripData } from '../TripDataProvider';

const MAX_VISIBLE = 5;

// Trip context bar: destination flags on the left, roster facepile on the right.
export default function TravelerFacepile({ onOpen }: { onOpen: () => void }) {
  const { profiles } = useTripData();
  if (profiles.length === 0) return null;

  const visible = profiles.slice(0, MAX_VISIBLE);
  const overflow = profiles.length - visible.length;

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex flex-none items-center gap-1.5" aria-label="Thailand and Vietnam">
        <ThaiFlag size={28} />
        <VietnamFlag size={28} />
      </span>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Who's going — ${profiles.length} people`}
        className="flex min-w-0 items-center gap-1.5 rounded-lg py-0.5 text-left transition-opacity hover:opacity-80 active:opacity-70"
      >
        <Users size={15} className="flex-none text-muted" aria-hidden />
        <span className="flex items-center gap-1">
          {visible.map((p) => (
            <Avatar key={p.id} name={p.name} src={p.avatar_url} size={24} />
          ))}
          {overflow > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ink/10 px-1 text-[10px] font-semibold text-ink">
              +{overflow}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
