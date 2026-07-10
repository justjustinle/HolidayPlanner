import Avatar from './Avatar.jsx';
import { PEOPLE } from '../data/people.js';

// A single activity: optional photo swatch, title + time, location, and a
// bottom row of attendee avatars and cost. Tapping opens the edit sheet.
export default function ActivityCard({ activity, onClick }) {
  const attendees = activity.people
    .map((selected, i) => (selected ? PEOPLE[i] : null))
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--hairline)',
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        gap: 10,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(60,40,20,.04)',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {activity.photo && (
        <div
          style={{
            width: 46,
            height: 46,
            flex: 'none',
            borderRadius: 10,
            background:
              'repeating-linear-gradient(45deg, oklch(90% 0.015 60) 0 6px, oklch(95% 0.01 70) 6px 12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 7,
              color: 'var(--muted-2)',
              lineHeight: 1.1,
            }}
          >
            {activity.photoLabel}
          </span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>
            {activity.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', flex: 'none' }}>
            {activity.time}
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
          {activity.location}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <div style={{ display: 'flex' }}>
            {attendees.map((person) => (
              <Avatar key={person.name} person={person} overlap />
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>
            {activity.cost}
          </div>
        </div>
      </div>
    </button>
  );
}
