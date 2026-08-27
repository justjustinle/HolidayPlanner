'use client';

import {
  useMemo,
  useState,
  useEffect,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  Beer,
  Bug,
  Camera,
  Coffee,
  Luggage,
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
  countFromWeightKg,
  formatLuggageDelta,
  luggageChangeTenths,
  photoUploadCounts,
  statFor,
  statTotals,
  weightKgFromCount,
} from '@/lib/stats';
import type { StatCategory } from '@/lib/types';

type IconType = ComponentType<LucideProps>;
type LeaderboardKey = StatCategory | 'photos' | 'luggage_change';

/** Custom toilet glyph (filled) — Lucide has no toilet icon. */
function ToiletIcon({ size = 24, className, ...rest }: LucideProps) {
  const { strokeWidth: _strokeWidth, absoluteStrokeWidth: _abs, ...svgRest } =
    rest;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 98.18 122.88"
      fill="currentColor"
      className={className}
      aria-hidden
      {...svgRest}
    >
      <path d="M21.58,24.97c0-1.01,0.82-1.82,1.82-1.82c1.01,0,1.82,0.82,1.82,1.82v33.33c0,1.01-0.82,1.82-1.82,1.82H1.82 C0.82,60.13,0,59.31,0,58.31V3.92c0-1.07,0.44-2.05,1.15-2.77l0.01-0.01C1.88,0.44,2.85,0,3.93,0H21.3c1.07,0,2.06,0.44,2.77,1.16 l0,0c0.71,0.71,1.15,1.69,1.15,2.77v4.62c0,1.01-0.82,1.82-1.82,1.82c-1.01,0-1.82-0.82-1.82-1.82V3.92c0-0.07-0.03-0.14-0.08-0.2 l0,0l0,0c-0.05-0.05-0.12-0.08-0.2-0.08H3.93c-0.08,0-0.15,0.03-0.2,0.08L3.72,3.73c-0.05,0.05-0.08,0.12-0.08,0.2v52.56h17.94 V24.97L21.58,24.97z M21.57,99.88L0.21,59.15c-0.46-0.89-0.12-1.98,0.77-2.45c0.27-0.14,0.56-0.21,0.84-0.21v-0.01h94.53 c1.01,0,1.82,0.82,1.82,1.82c0,0.07,0,0.14-0.01,0.21c-0.51,21.74-11.17,27.86-20.14,33c-5.24,3.01-9.83,5.64-10.69,11.21 l-0.01,0.05c-0.33,2.18-0.15,4.68,0.54,7.51c0.72,2.95,1.99,6.27,3.84,9.96c0.45,0.9,0.08,1.99-0.82,2.44 c-0.26,0.13-0.54,0.19-0.81,0.19l-57.06,0c-1.01,0-1.82-0.82-1.82-1.82c0-0.35,0.1-0.68,0.28-0.96L21.57,99.88L21.57,99.88z M4.83,60.13l20.39,38.89c0.26,0.5,0.28,1.11,0.01,1.65l-9.28,18.57h51.24c-1.3-2.89-2.25-5.59-2.86-8.09 c-0.81-3.32-1.01-6.29-0.61-8.91l0.01-0.06c1.13-7.3,6.43-10.34,12.48-13.81c7.92-4.54,17.29-9.92,18.26-28.23H4.83L4.83,60.13z M23.61,101.68c-1.01,0-1.82-0.82-1.82-1.82c0-1.01,0.82-1.82,1.82-1.82H43.5c1.01,0,1.82,0.82,1.82,1.82 c0,1.01-0.82,1.82-1.82,1.82H23.61L23.61,101.68z M25.21,58.58c-0.15,0.99-1.08,1.68-2.07,1.53c-0.99-0.15-1.68-1.08-1.53-2.07 c0.29-1.88,0.76-3.58,1.42-5.07c0.69-1.55,1.58-2.86,2.67-3.93c3.54-3.46,8.04-3.38,12.34-3.3c0.38,0.01,0.75,0.01,1.72,0.01 l38.96,0c9.24-0.06,19.48-0.13,19.43,13c0,1-0.81,1.81-1.81,1.81s-1.81-0.81-1.81-1.81c0.04-9.48-8.28-9.42-15.78-9.37 c-1.13,0.01-1.1,0.02-1.77,0.02H39.77l-1.78-0.03c-3.56-0.06-7.29-0.13-9.75,2.28c-0.77,0.75-1.39,1.68-1.89,2.79 C25.83,55.6,25.45,56.98,25.21,58.58L25.21,58.58z M15.33,11.17c2.83,0,5.12,2.29,5.12,5.12c0,2.83-2.29,5.12-5.12,5.12 c-2.83,0-5.12-2.29-5.12-5.12C10.21,13.46,12.51,11.17,15.33,11.17L15.33,11.17z M20.45,18.11c-1.01,0-1.82-0.82-1.82-1.82 c0-1.01,0.82-1.82,1.82-1.82h12.28c1.01,0,1.82,0.82,1.82,1.82c0,1.01-0.82,1.82-1.82,1.82H20.45L20.45,18.11z" />
    </svg>
  );
}

const STAT_ICONS: Record<LeaderboardKey, IconType> = {
  poop: ToiletIcon,
  drink: Beer,
  mosquito: Bug,
  coffee: Coffee,
  cards: Spade,
  photos: Camera,
  luggage_before: Luggage,
  luggage_after: Luggage,
  luggage_change: Luggage,
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

function LuggageWeightField({
  label,
  valueTenths,
  disabled,
  onCommit,
}: {
  label: string;
  valueTenths: number;
  disabled?: boolean;
  onCommit: (tenths: number) => void;
}) {
  const [draft, setDraft] = useState(
    valueTenths > 0 ? weightKgFromCount(valueTenths).toFixed(1) : ''
  );

  useEffect(() => {
    setDraft(valueTenths > 0 ? weightKgFromCount(valueTenths).toFixed(1) : '');
  }, [valueTenths]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onCommit(0);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft(valueTenths > 0 ? weightKgFromCount(valueTenths).toFixed(1) : '');
      return;
    }
    onCommit(countFromWeightKg(parsed));
  };

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-cream px-2.5 py-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          disabled={disabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder="0.0"
          className="min-w-0 flex-1 bg-transparent font-serif text-[22px] font-semibold leading-none text-ink outline-none tabular-nums placeholder:text-muted/40 disabled:opacity-40"
          aria-label={`${label} luggage weight in kilograms`}
        />
        <span className="flex-none text-[12px] text-muted">kg</span>
      </span>
    </label>
  );
}

export default function StatsTab() {
  const { profiles, me, stats, photos, setStat } = useTripData();

  const myCount = (category: StatCategory) =>
    me ? statFor(stats, me.id, STATS_DAY, category) : 0;

  const myBefore = myCount('luggage_before');
  const myAfter = myCount('luggage_after');
  const myDelta =
    myBefore > 0 && myAfter > 0 ? myAfter - myBefore : null;

  const myPhotoCount = useMemo(
    () => (me ? photoUploadCounts(profiles, photos).get(me.id) ?? 0 : 0),
    [me, profiles, photos]
  );

  // Trip-wide totals per category, ranked for the live leaderboards.
  const leaderboards = useMemo(
    () =>
      ALL_LEADERBOARD_CATEGORIES.map((cat) => {
        if (cat.key === 'luggage_change') {
          const deltas = luggageChangeTenths(profiles, stats);
          const rows = profiles
            .map((p) => ({
              profile: p,
              total: deltas.get(p.id) ?? null,
            }))
            .sort((a, b) => {
              // Logged deltas first (highest gain wins), then unset.
              if (a.total === null && b.total === null) return 0;
              if (a.total === null) return 1;
              if (b.total === null) return -1;
              return b.total - a.total;
            });
          return { ...cat, rows };
        }
        const totals =
          cat.key === 'photos'
            ? photoUploadCounts(profiles, photos)
            : statTotals(profiles, stats, cat.key);
        const rows = profiles
          .map((p) => ({
            profile: p,
            total: totals.get(p.id) ?? 0,
          }))
          .sort((a, b) => (b.total as number) - (a.total as number));
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
        <div className="mb-4 grid grid-cols-2 gap-2">
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
            <div className="mt-2 text-center font-serif text-[28px] font-semibold leading-none text-ink">
              {myPhotoCount}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-muted">
              counted from the trip photos you&apos;ve uploaded
            </p>
          </div>
        </div>

        {/* Luggage check-in — before / after holiday */}
        <div className="mb-8 rounded-2xl border border-black/5 bg-cream-card p-3 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <StatIconBadge icon={Luggage} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-tight text-ink">
                Luggage check-in
              </p>
              <p className="text-[11px] leading-snug text-muted">
                Weight before the holiday and after
              </p>
            </div>
            {myDelta !== null && (
              <span
                className="ml-auto flex-none rounded-full px-2.5 py-0.5 text-[12px] font-semibold tabular-nums"
                style={{ background: ACCENT_TINT, color: ACCENT }}
              >
                {formatLuggageDelta(myDelta)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <LuggageWeightField
              label="Before"
              valueTenths={myBefore}
              disabled={!me}
              onCommit={(tenths) =>
                setStat(STATS_DAY, 'luggage_before', tenths)
              }
            />
            <LuggageWeightField
              label="After"
              valueTenths={myAfter}
              disabled={!me}
              onCommit={(tenths) =>
                setStat(STATS_DAY, 'luggage_after', tenths)
              }
            />
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
            const isLuggage = board.key === 'luggage_change';
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
                    const hasValue =
                      total !== null &&
                      (isLuggage ? true : (total as number) > 0);
                    const isLeader = i === 0 && hasValue;
                    const display = isLuggage
                      ? total === null
                        ? '—'
                        : formatLuggageDelta(total)
                      : (total as number).toLocaleString();
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
                              : hasValue
                                ? 'text-[14px] font-semibold text-ink'
                                : 'text-[14px] text-muted'
                          }`}
                        >
                          {display}
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
