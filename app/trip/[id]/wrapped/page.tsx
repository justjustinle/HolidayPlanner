import type { Metadata } from 'next';
import Link from 'next/link';
import WrappedView from '@/components/wrapped/WrappedView';
import YarnLogo from '@/components/brand/YarnLogo';
import { loadWrappedTrip } from '@/lib/wrappedLoad';

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await loadWrappedTrip(params.id);
  if (!result.ok) {
    return {
      title: 'Trip Wrapped · Yarn',
      description: 'A Yarn trip recap.',
    };
  }

  const { data } = result;
  const description = [
    data.dateRangeLabel,
    data.destinations.slice(0, 3).join(', '),
    data.members.length ? `${data.members.length} travelers` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title: `${data.trip.name} · Trip Wrapped`,
    description: description || 'A Yarn trip recap.',
    openGraph: {
      title: `${data.trip.name} · Trip Wrapped`,
      description: description || 'A Yarn trip recap.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.trip.name} · Trip Wrapped`,
      description: description || 'A Yarn trip recap.',
    },
  };
}

function MissingState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6 text-center text-ink">
      <div className="mb-4 text-bangkok">
        <YarnLogo size={36} color="currentColor" />
      </div>
      <h1 className="font-serif text-[28px] font-semibold">{title}</h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">{body}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-cream"
      >
        Back to Yarn
      </Link>
    </main>
  );
}

export default async function TripWrappedPage({ params }: PageProps) {
  const result = await loadWrappedTrip(params.id);

  if (!result.ok) {
    if (result.reason === 'not_configured') {
      return (
        <MissingState
          title="Wrapped isn’t available here"
          body="This environment isn’t connected to trip data yet. Open Yarn with Supabase configured to generate a recap."
        />
      );
    }
    if (result.reason === 'not_found') {
      return (
        <MissingState
          title="Trip not found"
          body="This Wrapped link doesn’t match a trip — double-check the URL or open it from the trip menu."
        />
      );
    }
    return (
      <MissingState
        title="Couldn’t load this Wrapped"
        body={result.message || 'Something went wrong loading the trip recap.'}
      />
    );
  }

  return <WrappedView data={result.data} />;
}
