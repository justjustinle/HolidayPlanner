'use client';

import Sheet from './Sheet';
import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';

// Roster of everyone on the trip. Opened from the hamburger drawer or the
// itinerary facepile — same sheet either way.
export default function WhoIsGoingSheet({ onClose }: { onClose: () => void }) {
  const { profiles, me } = useTripData();
  const activeProfiles = profiles.filter((profile) => !profile.left_at);
  const count = activeProfiles.length;

  return (
    <Sheet title="Who's going" onClose={onClose}>
      <p className="mb-4 text-[13px] text-muted">
        {count === 0
          ? 'Nobody has joined yet.'
          : `${count} ${count === 1 ? 'person' : 'people'} on this trip`}
      </p>

      {count === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-[14px] text-muted">
          When someone picks their name at the welcome gate, they show up here.
        </div>
      ) : (
        <ul className="space-y-1">
          {activeProfiles.map((p) => {
            const isYou = me?.id === p.id;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <Avatar name={p.name} src={p.avatar_url} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium text-ink">
                    {p.name}
                    {isYou && (
                      <span className="ml-1.5 text-[12px] font-normal text-muted">(you)</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
