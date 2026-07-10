// Day selector: label + sub-date stacked, with an accent-colored bottom border
// under the active day.
export default function DayTabs({ days, activeIndex, accent, onSelect }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        marginTop: 16,
        borderBottom: '1px solid oklch(88% 0.015 60)',
      }}
    >
      {days.map((day, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={day.label}
            onClick={() => onSelect(i)}
            style={{
              flex: 'none',
              padding: '0 0 9px',
              cursor: 'pointer',
              textAlign: 'center',
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${active ? accent : 'transparent'}`,
              color: active ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            <div style={{ fontSize: 14 }}>{day.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
              {day.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}
