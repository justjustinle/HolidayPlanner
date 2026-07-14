'use client';

import { useMemo, type ComponentType, type ReactNode } from 'react';
import {
  Beer,
  Bug,
  Camera,
  Coffee,
  Minus,
  Plus,
  Spade,
  type LucideProps,
} from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import Avatar from '../ui/Avatar';
import {
  ALL_LEADERBOARD_CATEGORIES,
  COUNTER_CATEGORIES,
  STATS_DAY,
  photoUploadCounts,
  statFor,
  statTotals,
} from '@/lib/stats';
import type { StatCategory } from '@/lib/types';

type IconType = ComponentType<LucideProps>;

/** Lucide has no toilet glyph — outline that matches its 24px stroke language. */
function ToiletIcon({
  size = 24,
  strokeWidth = 2,
  className,
  ...rest
}: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      {/* cistern */}
      <rect x="7" y="2" width="10" height="5" rx="1.5" />
      {/* bowl rim */}
      <path d="M5 10h14a1 1 0 0 1 1 1v1c0 4.5-3.5 7-8 7s-8-2.5-8-7v-1a1 1 0 0 1 1-1z" />
      {/* base / trap */}
      <path d="M9 19v2h6v-2" />
    </svg>
  );
}

const STAT_ICONS: Record<StatCategory | 'photos', IconType> = {
  poop: ToiletIcon,
  drink: Beer,
  mosquito: Bug,
  coffee: Coffee,
  cards: Spade,
  photos: Camera,
};

const ACCENT = 'var(--city-accent)';
const ACCENT_TINT = 'color-mix(in srgb, var(--city-accent) 12%, #fdfbf5)';

function StatIconBadge({
  icon: Icon,
  size = 28,
}: {
  icon: IconType;
  size?: number;
}) {
  const glyph = Math.round(size * 0.5);
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: ACCENT_TINT,
        color: ACCENT,
      }}
      aria-hidden
    >
      <Icon size={glyph} strokeWidth={2} />
    </span>
  );
}

function RankChip({ rank }: { rank: number }) {
  const base =
    'inline-flex h-5 min-w-5 flex-none items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums';
  if (rank === 1) {
    return (
      <span className={`${base} text-white`} style={{ background: ACCENT }}>
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className={`${base} bg-[#b8b4ab] text-white`}>{rank}</span>
    );
  }
  if (rank === 3) {
    return (
      <span className={`${base} bg-[#c4a484] text-white`}>{rank}</span>
    );
  }
  return (
    <span
      className={`${base} border border-black/15 bg-transparent text-muted`}
    >
      {rank}
    </span>
  );
}

function GhostStepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-black/25 bg-transparent text-ink transition-colors disabled:opacity-30 active:enabled:[background:color-mix(in_srgb,var(--city-accent)_12%,#fdfbf5)]"
    >
      {children}
    </button>
  );
}

export default function StatsTab() {
  const { profiles, me, stats, photos, setStat } = useTripData();

  const myCount = (category: StatCategory) =>
    me ? statFor(stats, me.id, STATS_DAY, category) : 0;

  const myPhotoCount = useMemo(
    () => (me ? photoUploadCounts(profiles, photos).get(me.id) ?? 0 : 0),
    [me, profiles, photos]
  );

  // Trip-wide totals per category, ranked for the live leaderboards.
  const leaderboards = useMemo(
    () =>
      ALL_LEADERBOARD_CATEGORIES.map((cat) => {
        const totals =
          cat.key === 'photos'
            ? photoUploadCounts(profiles, photos)
            : statTotals(profiles, stats, cat.key);
        const rows = profiles
          .map((p) => ({ profile: p, total: totals.get(p.id) ?? 0 }))
          .sort((a, b) => b.total - a.total);
        return { ...cat, rows };
      }),
    [profiles, stats, photos]
  );

  return (
    <div>
      <TabHeader variant="section" title="My Stats" />

      <div className="px-5 pb-10 pt-4">
        {!me && (
          <p className="mb-3 rounded-xl bg-black/5 px-3 py-2 text-[13px] text-muted">
            Sign in from the menu to log your stats.
          </p>
        )}

        {/* Compact self counters */}
        <div className="mb-8 grid grid-cols-2 gap-2">
          {COUNTER_CATEGORIES.map((cat) => {
            const count = myCount(cat.key);
            const Icon = STAT_ICONS[cat.key];
            return (
              <div
                key={cat.key}
                className="rounded-2xl border border-black/5 bg-cream-card p-2.5 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <StatIconBadge icon={Icon} />
                  <span className="min-w-0 truncate text-[12px] leading-tight text-muted">
                    {cat.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <GhostStepButton
                    onClick={() => setStat(STATS_DAY, cat.key, count - 1)}
                    disabled={!me || count === 0}
                    label={`One less ${cat.label}`}
                  >
                    <Minus size={15} strokeWidth={2} />
                  </GhostStepButton>
                  <span className="min-w-[2ch] text-center font-serif text-[28px] font-semibold leading-none text-ink">
                    {count}
                  </span>
                  <GhostStepButton
                    onClick={() => setStat(STATS_DAY, cat.key, count + 1)}
                    disabled={!me}
                    label={`One more ${cat.label}`}
                  >
                    <Plus size={15} strokeWidth={2} />
                  </GhostStepButton>
                </div>
              </div>
            );
          })}

          {/* Read-only photo tracker */}
          <div className="rounded-2xl border border-black/5 bg-cream-card p-2.5 shadow-card">
            <div className="flex items-center gap-2">
              <StatIconBadge icon={Camera} />
              <span className="min-w-0 truncate text-[12px] leading-tight text-muted">
                Photos I&apos;ve taken
              </span>
            </div>
            <div className="mt-2 font-serif text-[28px] font-semibold leading-none text-ink">
              {myPhotoCount}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-muted">
              counted from the trip photos you&apos;ve uploaded
            </p>
          </div>
        </div>

        {/* Leaderboards */}
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-[22px] font-semibold leading-tight text-ink">
            Leaderboards
          </h2>
          <span className="rounded-full border border-black/15 px-2.5 py-0.5 text-[11px] text-muted">
            Whole trip
          </span>
        </div>

        <div className="space-y-4">
          {leaderboards.map((board) => {
            const Icon = STAT_ICONS[board.key];
            return (
              <div
                key={board.key}
                className="rounded-2xl border border-black/5 bg-cream-card p-4 shadow-card"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <StatIconBadge icon={Icon} size={32} />
                  <span className="font-serif text-[17px] font-semibold text-ink">
                    {board.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {board.rows.map(({ profile, total }, i) => {
                    const isMe = me?.id === profile.id;
                    const isLeader = i === 0 && total > 0;
                    return (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between gap-2 rounded-xl px-2 py-2"
                        style={
                          isMe
                            ? { background: ACCENT_TINT }
                            : undefined
                        }
                      >
                        <span className="flex min-w-0 items-center gap-2 text-[14px] text-ink">
                          <RankChip rank={i + 1} />
                          <Avatar
                            name={profile.name}
                            src={profile.avatar_url}
                            size={22}
                          />
                          <span className="truncate font-medium">
                            {profile.name}
                          </span>
                          {isMe && (
                            <span className="flex-none text-[11px] text-muted">
                              (you)
                            </span>
                          )}
                        </span>
                        <span
                          className={`flex-none tabular-nums ${
                            isLeader
                              ? 'font-serif text-[16px] font-bold text-ink'
                              : total > 0
                                ? 'text-[14px] font-semibold text-ink'
                                : 'text-[14px] text-muted'
                          }`}
                        >
                          {total.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
