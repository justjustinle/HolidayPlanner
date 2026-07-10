import { PEOPLE } from '../data/people.js';

const inputStyle = {
  boxSizing: 'border-box',
  border: '1px solid var(--hairline-strong)',
  borderRadius: 10,
  padding: '11px 12px',
  fontFamily: 'var(--sans)',
  fontSize: 15,
  background: 'var(--card)',
  color: 'var(--ink)',
};

// Bottom sheet for adding or editing an activity. Slides up over a dark scrim;
// tapping the scrim or the ✕ cancels without saving.
export default function ActivitySheet({
  mode,
  form,
  onChange,
  onTogglePerson,
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = mode === 'edit';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(30,20,10,.35)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 40,
      }}
    >
      <div
        className="no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--cream)',
          borderRadius: '24px 24px 0 0',
          padding: '18px 20px 26px',
          maxHeight: '80%',
          overflow: 'auto',
          animation: 'sheet-up .28s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'oklch(85% 0.01 60)',
            borderRadius: 3,
            margin: '0 auto 16px',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)' }}>
            {isEdit ? 'Edit activity' : 'New activity'}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              fontSize: 18,
              color: 'var(--muted)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <input
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Activity name"
          style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={form.time}
            onChange={(e) => onChange('time', e.target.value)}
            placeholder="Time, e.g. 9:00 AM"
            style={{ ...inputStyle, flex: 1, fontSize: 14 }}
          />
          <input
            value={form.cost}
            onChange={(e) => onChange('cost', e.target.value)}
            placeholder="Cost, e.g. ฿500pp"
            style={{ ...inputStyle, flex: 1, fontSize: 14 }}
          />
        </div>

        <input
          value={form.location}
          onChange={(e) => onChange('location', e.target.value)}
          placeholder="Location"
          style={{ ...inputStyle, width: '100%', fontSize: 14, marginBottom: 14 }}
        />

        <div
          style={{
            fontSize: 12,
            letterSpacing: 0.6,
            color: 'var(--muted)',
            marginBottom: 8,
          }}
        >
          WHO'S GOING
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {PEOPLE.map((person, i) => {
            const selected = form.people[i];
            return (
              <button
                key={person.name}
                onClick={() => onTogglePerson(i)}
                aria-pressed={selected}
                title={person.name}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: '#fff',
                  background: person.color,
                  opacity: selected ? 1 : 0.3,
                  border: `2px solid ${selected ? person.color : 'transparent'}`,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {person.initial}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {isEdit && (
            <button
              onClick={onDelete}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                border: '1.5px solid var(--hairline-strong)',
                background: 'none',
                color: 'oklch(50% 0.1 30)',
                fontSize: 14,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={onSave}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              background: 'var(--ink)',
              color: '#fff',
              fontSize: 14,
              textAlign: 'center',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {isEdit ? 'Save changes' : 'Add to itinerary'}
          </button>
        </div>
      </div>
    </div>
  );
}
