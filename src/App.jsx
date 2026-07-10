import { useState } from 'react';
import DestinationChips from './components/DestinationChips.jsx';
import DayTabs from './components/DayTabs.jsx';
import ActivityGroup from './components/ActivityGroup.jsx';
import ActivitySheet from './components/ActivitySheet.jsx';
import { seedTrips, GROUPS } from './data/trips.js';
import { PEOPLE } from './data/people.js';

const emptyForm = () => ({
  title: '',
  time: '',
  location: '',
  cost: '',
  people: PEOPLE.map(() => false),
});

export default function App() {
  const [trips, setTrips] = useState(seedTrips);
  const [tripIndex, setTripIndex] = useState(0);
  // Each trip remembers its own last-viewed day.
  const [dayIndexByTrip, setDayIndexByTrip] = useState(() => trips.map(() => 0));
  const [sheet, setSheet] = useState(null); // { mode: 'add'|'edit', group, id? }
  const [form, setForm] = useState(emptyForm);

  const currentTrip = trips[tripIndex];
  const dayIndex = dayIndexByTrip[tripIndex];
  const currentDay = currentTrip.days[dayIndex];
  const accent = currentTrip.accent;

  const selectTrip = (i) => setTripIndex(i);

  const selectDay = (i) =>
    setDayIndexByTrip((prev) => {
      const next = prev.slice();
      next[tripIndex] = i;
      return next;
    });

  const openAdd = (group) => {
    setSheet({ mode: 'add', group });
    setForm(emptyForm());
  };

  const openQuickAdd = () => openAdd('evening');

  const openEdit = (group, id) => {
    const activity = currentDay.groups[group].find((a) => a.id === id);
    if (!activity) return;
    setSheet({ mode: 'edit', group, id });
    setForm({
      title: activity.title,
      time: activity.time,
      location: activity.location,
      cost: activity.cost,
      people: activity.people.slice(),
    });
  };

  const closeSheet = () => {
    setSheet(null);
    setForm(emptyForm());
  };

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePerson = (i) =>
    setForm((prev) => {
      const people = prev.people.slice();
      people[i] = !people[i];
      return { ...prev, people };
    });

  // Apply a mutation to the current trip's current day's timeslot groups.
  const mutateCurrentDay = (mutator) => {
    setTrips((prev) =>
      prev.map((trip, ti) => {
        if (ti !== tripIndex) return trip;
        return {
          ...trip,
          days: trip.days.map((day, di) => {
            if (di !== dayIndex) return day;
            return { ...day, groups: mutator({ ...day.groups }) };
          }),
        };
      })
    );
  };

  const saveActivity = () => {
    if (!sheet || !form.title.trim()) {
      closeSheet();
      return;
    }
    const { mode, group, id } = sheet;
    mutateCurrentDay((groups) => {
      if (mode === 'edit') {
        groups[group] = groups[group].map((a) =>
          a.id === id
            ? {
                ...a,
                title: form.title,
                time: form.time,
                location: form.location,
                cost: form.cost,
                people: form.people,
              }
            : a
        );
      } else {
        groups[group] = [
          ...groups[group],
          {
            id: 'a' + Date.now(),
            title: form.title,
            time: form.time,
            location: form.location,
            cost: form.cost,
            photo: false,
            people: form.people,
          },
        ];
      }
      return groups;
    });
    closeSheet();
  };

  const deleteActivity = () => {
    if (!sheet || sheet.mode !== 'edit') return;
    const { group, id } = sheet;
    mutateCurrentDay((groups) => {
      groups[group] = groups[group].filter((a) => a.id !== id);
      return groups;
    });
    closeSheet();
  };

  const headerStyle = {
    flex: 'none',
    padding: '66px 20px 0',
    background: `radial-gradient(120% 90% at 15% 0%, ${accent.replace(
      ')',
      ' / 0.14)'
    )}, var(--cream) 60%)`,
  };

  const weaveStyle = {
    height: 5,
    marginTop: 14,
    borderRadius: 3,
    background: `repeating-linear-gradient(90deg, ${accent} 0 10px, transparent 10px 16px, oklch(60% 0.03 40 / 0.4) 16px 22px, transparent 22px 28px)`,
    opacity: 0.55,
  };

  return (
    <div className="app-stage">
      <div className="device">
        {/* header */}
        <div style={headerStyle}>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 26,
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '.2px',
            }}
          >
            {currentTrip.name}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: accent,
                flex: 'none',
              }}
            />
            <span>{currentTrip.dateRange}</span>
          </div>

          <DestinationChips
            trips={trips}
            activeIndex={tripIndex}
            onSelect={selectTrip}
          />

          <DayTabs
            days={currentTrip.days}
            activeIndex={dayIndex}
            accent={accent}
            onSelect={selectDay}
          />

          <div style={weaveStyle} />
          <div style={{ height: 10 }} />
        </div>

        {/* scrollable body */}
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '14px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {GROUPS.map((g) => (
            <ActivityGroup
              key={g.key}
              label={g.label}
              accent={accent}
              activities={currentDay.groups[g.key] || []}
              onAdd={() => openAdd(g.key)}
              onOpen={(id) => openEdit(g.key, id)}
            />
          ))}
          <div style={{ height: 6, flex: 'none' }} />
        </div>

        {/* FAB */}
        <div
          style={{
            position: 'sticky',
            bottom: 18,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 20px',
            pointerEvents: 'none',
          }}
        >
          <button
            onClick={openQuickAdd}
            aria-label="Add activity"
            style={{
              pointerEvents: 'auto',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: accent,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              boxShadow: '0 6px 18px oklch(40% 0.1 40 / 0.35)',
              cursor: 'pointer',
              border: 'none',
              lineHeight: 1,
            }}
          >
            +
          </button>
        </div>

        {/* sheet overlay */}
        {sheet && (
          <ActivitySheet
            mode={sheet.mode}
            form={form}
            onChange={updateForm}
            onTogglePerson={togglePerson}
            onSave={saveActivity}
            onDelete={deleteActivity}
            onClose={closeSheet}
          />
        )}
      </div>
    </div>
  );
}
