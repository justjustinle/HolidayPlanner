# Holiday Itinerary App

A mobile-first group holiday planner. Browse a day-by-day itinerary across four
destinations (Bangkok → Phuket → Saigon → Nha Trang) and add, edit, or delete
activities in any timeslot (Morning / Afternoon / Evening). Each activity carries
its time, location, cost split, and who's going.

Recreated in React from the design reference in the
[Holiday Itinerary App](https://claude.ai/design/p/e98ffffb-e4a0-49c8-91f5-4ec8a6c7bb00)
Claude Design project.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/)
- Plain CSS with design tokens as CSS custom properties (`src/styles.css`)
- Fonts: Spectral (headlines) and Work Sans (UI), loaded from Google Fonts

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Features

- **Destinations** — horizontally scrollable pill row; each has its own accent color
- **Days** — per-trip day tabs; every trip remembers its last-viewed day
- **Timeslots** — Morning / Afternoon / Evening groups, each with activity cards
  or an empty-state prompt
- **Add / edit / delete** — bottom sheet with name, time, cost, location, and a
  who's-going avatar toggle for the five group members
- **Floating action button** — quick-adds to the Evening group

All data is in-memory client state seeded from `src/data/trips.js`; there is no
backend in this reference build.

## Project structure

```
src/
  App.jsx                  # top-level state + layout
  components/
    Avatar.jsx             # circular person avatar
    DestinationChips.jsx   # destination pill row
    DayTabs.jsx            # per-trip day selector
    ActivityGroup.jsx      # one timeslot section
    ActivityCard.jsx       # a single activity
    ActivitySheet.jsx      # add/edit bottom sheet
  data/
    people.js              # the five group members + avatar colors
    trips.js               # seed itinerary data + timeslot groups
  styles.css               # design tokens, device frame, resets
```
