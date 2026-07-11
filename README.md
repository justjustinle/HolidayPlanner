# Vietnam & Thailand Trip Planner

A mobile-first, installable **PWA** for a group holiday across Bangkok →
Phuket → Saigon → Nha Trang. Plan a day-by-day itinerary, attach one Polaroid
memory per activity, split expenses across three currencies, and keep a shared
packing list — all synced to the whole group in realtime.

Built from the collaborative-travel product spec as a **Next.js 14 (App
Router) + TypeScript + Tailwind CSS + Supabase** app.

## Features

- **One-time login gate** — enter your name once; it's cached in
  `localStorage`. Re-entering the same name on a new device (or after a cache
  wipe) recovers your existing profile.
- **Tab 1 · Itinerary & memories** — day-grouped activity cards. Each card has
  a physical **Polaroid frame**: a dashed "📸 Add Memory" canvas that opens the
  device camera, replaced by a 1:1 photo with a handwritten caption once set
  (exactly one photo per card). A **Log Bill** drawer captures spend against
  the activity.
- **Tab 2 · Money** — group-editable **exchange rates** (VND/THB per £1), a
  live GBP conversion when logging bills, and a **greedy debt-minimization**
  settlement using the net-balance method ("Priya → Alex £8.31").
- **Tab 3 · Logistics** — group + personal **packing checklists**, transit &
  hotel reference cards for taxi drivers, and a Thai/Vietnamese phrasebook.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Lucide React icons |
| Backend | Supabase (PostgreSQL + Realtime + Storage) |
| PWA | Web manifest + service worker (`public/sw.js`) |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see "Supabase vs demo mode" below
npm run dev                  # http://localhost:3000
```

Build & run production:

```bash
npm run build && npm run start
```

### Supabase vs demo mode

The app runs in one of two modes automatically:

- **Demo mode (default, no config):** all data lives in the browser
  (`localStorage`), seeded with sample people, activities, an expense, and a
  packing list. Great for exploring the UI immediately. A banner indicates
  you're in demo mode.
- **Live mode:** set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The app then reads/writes
  your Supabase project and subscribes to realtime changes so the whole group
  stays in sync.

To set up the backend:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL Editor (creates
   tables, RLS policies, realtime publication, and the public `memories`
   storage bucket).
3. Copy the project URL and anon key into `.env.local`.

## Project structure

```
app/
  layout.tsx            # root layout, PWA meta, fonts, service-worker register
  page.tsx              # provider + app root
  globals.css           # Tailwind + design tokens
components/
  AppRoot.tsx           # loading / gate / shell switch
  WelcomeGate.tsx       # one-time name login
  AppShell.tsx          # three-tab shell + bottom nav
  TripDataProvider.tsx  # data layer: Supabase OR localStorage demo + realtime
  ServiceWorkerRegister.tsx
  tabs/                 # ItineraryTab, FinanceTab, LogisticsTab
  itinerary/            # ItineraryCard, Polaroid, AddCardSheet, LogBillSheet
  finance/              # RateSettings
  ui/                   # Avatar, Sheet, TabHeader
lib/
  supabase.ts           # client + isSupabaseConfigured
  types.ts              # domain types (mirror the SQL schema)
  trip.ts               # fixed trip days / destinations
  currency.ts           # GBP conversion, 2-dp rounding, equal split
  settle.ts             # net balances + greedy transfer minimization
  avatar.ts             # deterministic per-name avatar color
  demo.ts, logistics.ts # seed + static reference content
supabase/schema.sql     # database + storage setup
public/                 # manifest.json, sw.js, icons
```

## Notes

- All money math funnels through `round2()` to avoid floating-point drift, and
  equal splits self-correct the last share so parts always sum to the total.
- The service worker is intentionally minimal and dependency-free; swap in
  `@ducanh2912/next-pwa` if you want Workbox-based runtime caching.
- RLS policies are fully public (no auth) for easy group access — tighten them
  if you later add Supabase Auth.
