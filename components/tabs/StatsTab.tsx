'use client';

import { useMemo, useState } from 'react';
import { Footprints, Images, Minus, Plus } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import DayPicker from '../ui/DayPicker';
import Avatar from '../ui/Avatar';
import { defaultDayNumber } from '@/lib/trip';
import {
  ALL_LEADERBOARD_CATEGORIES,
  COUNTER_CATEGORIES,
  photoTagCounts,
  statFor,
  statTotals,
} from '@/lib/stats';
import type { StatCategory } from '@/lib/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function StatsTab() {
  const { profiles, me, stats, photos, itinerary, setStat } = useTripData();
  const [day, setDay] = useState(defaultDayNumber);

  const myCount = (category: StatCategory) =>
    me ? statFor(stats, me.id, day, category) : 0;

  const myPhotoCount = useMemo(
    () => (me ? photoTagCounts(profiles, photos, itinerary, day).get(me.id) ?? 0 : 0),
    [me, profiles, photos, itinerary, day]
  );

  // Trip-wide totals per category, ranked for the live leaderboards.
  const leaderboards = useMemo(
    () =>
      ALL_LEADERBOARD_CATEGORIES.map((cat) => {
        const totals =
          cat.key === 'photos'
            ? photoTagCounts(profiles, photos, itinerary)
            : statTotals(profiles, stats, cat.key);
        const rows = profiles
          .map((p) => ({ profile: p, total: totals.get(p.id) ?? 0 }))
          .sort((a, b) => b.total - a.total);
        return { ...cat, rows };
      }),
    [profiles, stats, photos, itinerary]
  );

  return (
    <div>
      <TabHeader eyebrow="Trip Olympics" title="Stats" />

      <div className="px-5 pb-10">
        <DayPicker value={day} onChange={setDay} />

        {/* daily submission */}
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
          My Day {day} log
        </h2>
        {!me && (
          <p className="mb-3 rounded-xl bg-black/5 px-3 py-2 text-[13px] text-muted">
            Sign in from the avatar menu to log your stats.
          </p>
        )}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {COUNTER_CATEGORIES.map((cat) => {
            const count = myCount(cat.key);
            return (
              <div
                key={cat.key}
                className="rounded-2xl border border-black/5 bg-cream-card p-3"
              >
                <div className="flex items-center gap-1.5 text-[12px] text-muted">
                  <span className="text-[15px]">{cat.emoji}</span> {cat.label}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => setStat(day, cat.key, count - 1)}
                    disabled={!me || count === 0}
                    aria-label={`One less ${cat.label}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink disabled:opacity-30"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-serif text-[26px] font-semibold text-ink">
                    {count}
                  </span>
                  <button
                    onClick={() => setStat(day, cat.key, count + 1)}
                    disabled={!me}
                    aria-label={`One more ${cat.label}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* read-only trackers */}
        <div className="mb-7 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-black/5 bg-cream-card p-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <Footprints size={14} /> Steps
            </div>
            <div className="mt-1 font-serif text-[26px] font-semibold text-ink">
              {(me ? statFor(stats, me.id, day, 'steps') : 0).toLocaleString()}
            </div>
            <div className="text-[10px] leading-tight text-muted">
              auto-synced from Apple Health (see README shortcut)
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream-card p-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <Images size={14} /> Photos I&apos;m in
            </div>
            <div className="mt-1 font-serif text-[26px] font-semibold text-ink">
              {myPhotoCount}
            </div>
            <div className="text-[10px] leading-tight text-muted">
              counted from tagged trip photos
            </div>
          </div>
        </div>

        {/* live leaderboards */}
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">
          Leaderboards · whole trip
        </h2>
        <div className="space-y-3">
          {leaderboards.map((board) => (
            <div
              key={board.key}
              className="rounded-2xl border border-black/5 bg-cream-card p-4"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[17px]">{board.emoji}</span>
                <span className="font-serif text-[16px] text-ink">{board.label}</span>
              </div>
              <div className="space-y-1.5">
                {board.rows.map(({ profile, total }, i) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between text-[14px]"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <span className="w-6 text-center">
                        {total > 0 && MEDALS[i] ? MEDALS[i] : <span className="text-[12px] text-muted">{i + 1}</span>}
                      </span>
                      <Avatar name={profile.name} src={profile.avatar_url} size={22} />
                      {profile.name}
                      {me?.id === profile.id && (
                        <span className="text-[11px] text-muted">(you)</span>
                      )}
                    </span>
                    <span className={total > 0 ? 'font-semibold text-ink' : 'text-muted'}>
                      {total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
