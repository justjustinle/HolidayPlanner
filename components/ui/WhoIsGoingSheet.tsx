'use client';

import { useState } from 'react';
import { Share2, Trash2, UserPlus, Loader2, Check } from 'lucide-react';
import Sheet from './Sheet';
import Avatar from './Avatar';
import { useTripData } from '../TripDataProvider';
import { useAuth } from '../AuthProvider';

// Roster of everyone on the trip. Opened from the hamburger drawer or the
// itinerary facepile. With auth on it also carries the invite link and (for the
// owner) roster management: add placeholder members, remove members.
export default function WhoIsGoingSheet({ onClose }: { onClose: () => void }) {
  const { profiles, me, getOrCreateInvite, addPlaceholderMember, removeMember } = useTripData();
  const { authEnabled } = useAuth();
  const isOwner = authEnabled && me?.role === 'owner';
  const count = profiles.length;

  const [inviteBusy, setInviteBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = async () => {
    setInviteBusy(true);
    setError(null);
    try {
      const code = await getOrCreateInvite();
      if (!code) {
        setError('No invite link yet — ask the trip owner to create one.');
        return;
      }
      const link = `${window.location.origin}/join/${code}`;
      if (navigator.share) {
        await navigator.share({ title: 'Join our trip on Yarn', url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      /* user dismissed the share sheet — ignore */
    } finally {
      setInviteBusy(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || adding) return;
    setAdding(true);
    setError(null);
    try {
      await addPlaceholderMember(newName);
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that person.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Sheet title="Who's going" onClose={onClose}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {count === 0
            ? 'Nobody has joined yet.'
            : `${count} ${count === 1 ? 'person' : 'people'} on this trip`}
        </p>
        {authEnabled && (
          <button
            type="button"
            onClick={invite}
            disabled={inviteBusy}
            className="flex flex-none items-center gap-1.5 rounded-full border border-black/15 bg-cream-card px-3 py-1.5 text-[13px] font-medium text-ink disabled:opacity-40"
          >
            {inviteBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : shared ? (
              <Check size={14} />
            ) : (
              <Share2 size={14} />
            )}
            {shared ? 'Link copied' : 'Invite'}
          </button>
        )}
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-[14px] text-muted">
          When someone picks their name at the welcome gate, they show up here.
        </div>
      ) : (
        <ul className="space-y-1">
          {profiles.map((p) => {
            const isYou = me?.id === p.id;
            const unclaimed = authEnabled && !p.user_id;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <Avatar name={p.name} src={p.avatar_url} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium text-ink">
                    {p.name}
                    {isYou && (
                      <span className="ml-1.5 text-[12px] font-normal text-muted">(you)</span>
                    )}
                  </div>
                  {unclaimed && (
                    <div className="text-[12px] text-muted">hasn&apos;t joined yet</div>
                  )}
                </div>
                {isOwner && !isYou && (
                  <button
                    type="button"
                    onClick={() => removeMember(p.id)}
                    aria-label={`Remove ${p.name}`}
                    className="flex-none text-muted/50 hover:text-saigon"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isOwner && (
        <form onSubmit={addMember} className="mt-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add someone (no app needed)"
            aria-label="Add member name"
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream-card px-4 py-2.5 text-[14px] text-ink outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={!newName.trim() || adding}
            className="flex flex-none items-center gap-1.5 rounded-xl bg-ink px-3 text-[14px] font-medium text-white disabled:opacity-40"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={15} />}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-[13px] text-saigon">{error}</p>}
    </Sheet>
  );
}
