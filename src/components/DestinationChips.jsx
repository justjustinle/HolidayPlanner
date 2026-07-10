// Horizontally scrollable pill row of destinations. The active chip is filled
// with its destination accent color; the rest are outlined.
export default function DestinationChips({ trips, activeIndex, onSelect }) {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginTop: 14,
        paddingBottom: 2,
      }}
    >
      {trips.map((trip, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={trip.name}
            onClick={() => onSelect(i)}
            style={{
              flex: 'none',
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: 13,
              cursor: 'pointer',
              border: `1.5px solid ${active ? trip.accent : 'oklch(88% 0.02 60)'}`,
              background: active ? trip.accent : 'var(--card)',
              color: active ? '#fff' : 'oklch(45% 0.02 50)',
            }}
          >
            {trip.name}
          </button>
        );
      })}
    </div>
  );
}
