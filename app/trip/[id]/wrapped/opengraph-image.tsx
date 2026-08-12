import { ImageResponse } from 'next/og';
import { loadWrappedTrip } from '@/lib/wrappedLoad';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: { id: string } };

export default async function OpenGraphImage({ params }: Props) {
  const result = await loadWrappedTrip(params.id);
  const title = result.ok ? result.data.trip.name : 'Trip Wrapped';
  const subtitle = result.ok
    ? [result.data.dateRangeLabel, result.data.destinations.slice(0, 3).join(' · ')]
        .filter(Boolean)
        .join('  ·  ')
    : 'A Yarn trip recap';
  const accent = result.ok ? result.data.accentHex : '#c9992e';
  const crew = result.ok
    ? result.data.members
        .slice(0, 6)
        .map((m) => m.name)
        .join('  ·  ')
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: `linear-gradient(160deg, ${accent} 0%, #1a1712 72%)`,
          color: '#f7f1e6',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: 0.85,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          Trip Wrapped
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 28,
                opacity: 0.78,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 22, opacity: 0.7, maxWidth: 780 }}>
            {crew || 'Made with Yarn'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, opacity: 0.9 }}>Yarn</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
