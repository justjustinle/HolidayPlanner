import ActivityCard from './ActivityCard.jsx';

// One timeslot section (Morning / Afternoon / Evening): accent-colored label,
// an "+ add" link, and either its activity cards or an empty-state prompt.
export default function ActivityGroup({ label, accent, activities, onAdd, onOpen }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: 1.2,
            color: accent,
            fontWeight: 600,
          }}
        >
          {label.toUpperCase()}
        </div>
        <button
          onClick={onAdd}
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          + add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onClick={() => onOpen(activity.id)}
          />
        ))}

        {activities.length === 0 && (
          <button
            onClick={onAdd}
            style={{
              border: '1.5px dashed oklch(85% 0.02 60)',
              borderRadius: 14,
              padding: 14,
              textAlign: 'center',
              fontSize: 13,
              color: 'oklch(60% 0.02 50)',
              cursor: 'pointer',
              background: 'none',
              width: '100%',
            }}
          >
            Nothing planned yet
          </button>
        )}
      </div>
    </div>
  );
}
