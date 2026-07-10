// A small circular avatar showing a person's initial in their color.
// `overlap` renders the negative-margin stacking used on activity cards.
export default function Avatar({ person, size = 20, overlap = false, style }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        color: '#fff',
        background: person.color,
        flex: 'none',
        ...(overlap
          ? { marginRight: -6, border: '1.5px solid var(--card)' }
          : null),
        ...style,
      }}
    >
      {person.initial}
    </div>
  );
}
