import Avatar from '@/components/ui/Avatar';
import YarnLogo from '@/components/brand/YarnLogo';
import { TripCountryFlags } from '@/components/ui/Flag';
import type { WrappedData } from '@/lib/wrapped';

function Section({
  children,
  accent,
  className = '',
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-[100dvh] w-full snap-start snap-always flex-col justify-center px-6 py-12 ${className}`}
      style={
        accent
          ? ({ ['--wrapped-accent' as string]: accent } as React.CSSProperties)
          : undefined
      }
    >
      <div className="mx-auto w-full max-w-app">{children}</div>
    </section>
  );
}

function Eyebrow({
  children,
  tone = 'cream',
}: {
  children: React.ReactNode;
  tone?: 'cream' | 'ink';
}) {
  return (
    <div
      className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${
        tone === 'ink' ? 'text-muted' : 'text-cream/55'
      }`}
    >
      {children}
    </div>
  );
}

function Cover({ data }: { data: WrappedData }) {
  return (
    <Section
      accent={data.accentHex}
      className="bg-[color-mix(in_srgb,var(--wrapped-accent)_28%,#1a1712)] text-cream"
    >
      <div className="mb-8 flex items-center gap-2 text-[color-mix(in_srgb,var(--wrapped-accent)_85%,white)]">
        <YarnLogo size={26} color="currentColor" />
        <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">
          Trip Wrapped
        </span>
      </div>

      <Eyebrow>The story of</Eyebrow>
      <h1 className="font-serif text-[42px] font-semibold leading-[1.05] tracking-tight text-cream">
        {data.trip.name}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[15px] text-cream/75">
        {data.dateRangeLabel && <span>{data.dateRangeLabel}</span>}
        {data.countries.length > 0 && (
          <TripCountryFlags countries={data.countries} size={26} />
        )}
      </div>

      {data.destinations.length > 0 && (
        <p className="mt-3 text-[14px] leading-relaxed text-cream/60">
          {data.destinations.join(' · ')}
        </p>
      )}

      {data.members.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/45">
            The crew
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {data.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Avatar name={m.name} src={m.avatar_url} size={36} ring />
                <span className="text-[14px] text-cream/85">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-14 text-[12px] text-cream/40">Scroll to relive it ↓</p>
    </Section>
  );
}

function Stats({ data }: { data: WrappedData }) {
  if (data.stats.length === 0) return null;
  return (
    <Section className="bg-cream text-ink">
      <Eyebrow tone="ink">By the numbers</Eyebrow>
      <h2 className="font-serif text-[34px] font-semibold leading-tight">
        A trip in stats
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {data.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/5 bg-cream-card px-4 py-5 shadow-card"
          >
            <div className="font-serif text-[28px] font-semibold leading-none text-ink">
              {stat.value}
            </div>
            <div className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Highlights({ data }: { data: WrappedData }) {
  if (data.highlights.length === 0) return null;
  return (
    <Section className="bg-[#1a1712] text-cream">
      <Eyebrow>Day by day</Eyebrow>
      <h2 className="font-serif text-[34px] font-semibold leading-tight">
        Highlight reel
      </h2>
      <p className="mt-2 text-[14px] text-cream/55">
        One frame from each day that made the cut.
      </p>
      <div className="mt-8 space-y-5">
        {data.highlights.map((h) => (
          <article
            key={h.dayNumber}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={h.photoUrl}
                alt={h.activityTitle}
                className="h-full w-full object-cover"
              />
              <div
                className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink"
                style={{ background: h.accentHex }}
              >
                {h.dayLabel} · {h.destination}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[15px] font-medium text-cream">
                {h.activityTitle}
              </div>
              <div className="mt-0.5 text-[12px] text-cream/50">
                {h.dateLabel}
                {h.activityLocation ? ` · ${h.activityLocation}` : ''}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Money({ data }: { data: WrappedData }) {
  if (!data.money) return null;
  const { money } = data;
  return (
    <Section
      accent={data.accentHex}
      className="bg-[color-mix(in_srgb,var(--wrapped-accent)_18%,#f7f1e6)] text-ink"
    >
      <Eyebrow tone="ink">Money moment</Eyebrow>
      <h2 className="font-serif text-[34px] font-semibold leading-tight">
        The group tab
      </h2>
      <p className="mt-3 font-serif text-[40px] font-semibold leading-none text-ink">
        {money.totalLabel}
      </p>
      <p className="mt-2 text-[14px] text-muted">total group spend</p>

      <div className="mt-8 space-y-3">
        {money.biggestPayer && (
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-cream-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={money.biggestPayer.name}
                src={money.biggestPayer.avatar_url}
                size={36}
              />
              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-wide text-muted">
                  Bankroller
                </div>
                <div className="truncate text-[15px] font-medium">
                  {money.biggestPayer.name}
                </div>
              </div>
            </div>
            <div className="flex-none text-[15px] font-semibold">
              {money.biggestPayer.amountLabel}
            </div>
          </div>
        )}

        {money.biggestIncurred && (
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-cream-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={money.biggestIncurred.name}
                src={money.biggestIncurred.avatar_url}
                size={36}
              />
              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-wide text-muted">
                  Lived it up
                </div>
                <div className="truncate text-[15px] font-medium">
                  {money.biggestIncurred.name}
                </div>
              </div>
            </div>
            <div className="flex-none text-[15px] font-semibold">
              {money.biggestIncurred.amountLabel}
            </div>
          </div>
        )}
      </div>

      {money.perPerson.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Everyone&apos;s share
          </div>
          <div className="space-y-2">
            {money.perPerson.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between text-[14px]"
              >
                <span className="flex items-center gap-2 text-ink">
                  <Avatar name={row.name} src={row.avatar_url} size={24} />
                  {row.name}
                </span>
                <span className="font-medium">{row.amountLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function Superlatives({ data }: { data: WrappedData }) {
  if (data.superlatives.length === 0) return null;
  return (
    <Section className="bg-ink text-cream">
      <Eyebrow>Awards season</Eyebrow>
      <h2 className="font-serif text-[34px] font-semibold leading-tight">
        Trip superlatives
      </h2>
      <div className="mt-8 space-y-3">
        {data.superlatives.map((s) => (
          <div
            key={s.key}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-[22px] leading-none">{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-cream/50">
                  {s.title}
                </div>
                {s.name ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Avatar name={s.name} src={s.avatar_url} size={28} />
                    <span className="text-[17px] font-medium text-cream">
                      {s.name}
                    </span>
                  </div>
                ) : null}
                <p className="mt-1 text-[13px] leading-relaxed text-cream/65">
                  {s.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Closing({ data }: { data: WrappedData }) {
  return (
    <Section
      accent={data.accentHex}
      className="bg-[color-mix(in_srgb,var(--wrapped-accent)_30%,#1a1712)] text-cream"
    >
      <Eyebrow>The end — for now</Eyebrow>
      <h2 className="font-serif text-[36px] font-semibold leading-tight">
        What a trip.
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-cream/70">
        {data.trip.name}
        {data.dateRangeLabel ? ` · ${data.dateRangeLabel}` : ''}
      </p>

      {data.closingPhotoUrl && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 shadow-polaroid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.closingPhotoUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      {data.members.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {data.members.map((m) => (
            <Avatar key={m.id} name={m.name} src={m.avatar_url} size={40} ring />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-cream px-5 py-3 text-[14px] font-semibold text-ink"
        >
          Relive it in Yarn
        </a>
        <p className="text-[12px] text-cream/45">Made with Yarn</p>
      </div>
    </Section>
  );
}

export default function WrappedView({ data }: { data: WrappedData }) {
  return (
    <main className="h-[100dvh] overflow-y-auto scroll-smooth bg-cream text-ink snap-y snap-mandatory">
      <Cover data={data} />
      <Stats data={data} />
      <Highlights data={data} />
      <Money data={data} />
      <Superlatives data={data} />
      <Closing data={data} />
    </main>
  );
}
