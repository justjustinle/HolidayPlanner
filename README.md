# Vietnam & Thailand Trip Planner

A mobile-first, installable **PWA** for a group holiday across Bangkok →
Phuket → Saigon → Nha Trang. Plan a day-by-day itinerary, fill Polaroid photo
carousels, scan receipts with Gemini and self-claim your items, and battle it
out on daily trip-stat leaderboards — all synced to the whole group in
realtime.

Built as a **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**
app.

## Features

Four tabs along the top, each with a **Day 1 … Day 13 selector** matching the
trip dates (28 Aug – 10 Sep).

- **Itinerary** — per-day activity cards. Each card has a **Polaroid carousel**:
  swipe through the activity's photos, with the last frame always being
  "📸 Add Memory" (multi-select supported). With no photos yet the frame
  collapses to a slim ~30% strip to keep scrolling short. Photos can be
  **tagged** with the people in them and **saved to your device** (share sheet
  on mobile, download elsewhere).
- **Photos** — the same carousels laid out as a day-by-day photo wall.
- **Money** — two ways to add spend:
  - **Upload receipt**: snap the bill, Gemini reads it into merchant, currency,
    and line items. Everyone then **self-claims their own items**; unclaimed
    lines stay untagged (the payer carries them until claimed).
  - **Log an expense**: name it, enter the cost in **VND / THB / GBP**, pick
    who paid and who splits it equally.
  Group-editable exchange rates and a **greedy debt-minimization** settlement
  ("Priya → Alex £8.31") cover both kinds.
- **Stats** — daily self-input counters (💩 poops, 🍻 drinks, 🦟 mozzie bites,
  ☕ coffees), a read-only **step counter** synced from Apple Health via an iOS
  Shortcut, a **photo counter** derived from tagged photos, and **live
  leaderboards** for every category.

Every photo (memories, avatars, receipts) is **compressed client-side to
≤1200px WebP** before upload (`browser-image-compression`), so phone-camera
5–10MB shots land around 100–300KB and the free 1GB storage tier lasts the
whole trip.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Lucide React icons |
| Backend | Supabase (PostgreSQL + Realtime + Storage) |
| AI | Google Gemini (receipt → JSON via `/api/scan-receipt`) |
| PWA | Web manifest + service worker (`public/sw.js`) |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see setup below
npm run dev                  # http://localhost:3000
```

Build & run production:

```bash
npm run build && npm run start
```

## Setup guide

### 1. Supabase (group sync, photos, expenses, stats)

The app runs in one of two modes automatically:

- **Demo mode (default, no config):** all data lives in the browser
  (`localStorage`), seeded with sample people, activities, a receipt, and
  stats. A banner indicates demo mode.
- **Live mode:** set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

To set up:

1. Create a Supabase project.
2. **Fresh project:** run [`supabase/schema.sql`](./supabase/schema.sql) in the
   SQL Editor. **Upgrading from v1:** run
   [`supabase/migration-v2.sql`](./supabase/migration-v2.sql) instead (adds
   photos, receipts, receipt items, stats; migrates old single photos and
   activity-linked expenses).
3. Copy the project URL and anon key into `.env.local` (and into your Vercel
   project's environment variables if deployed).

### 2. Gemini receipt scanning

1. Get a free API key at <https://aistudio.google.com/apikey>.
2. Set `GEMINI_API_KEY` in `.env.local` / Vercel env vars (server-side only —
   it is never shipped to the browser).
3. Default model is `gemini-1.5-flash`. If your key can't access 1.5 (Google
   has been sunsetting it for new projects), set `GEMINI_MODEL=gemini-2.0-flash`
   — the payload format is identical.

Flow: Money tab → **Upload receipt** → photo is compressed to WebP → sent to
`POST /api/scan-receipt` → Gemini returns
`{ merchant, currency, total, items: [{ name, quantity, price }] }` → you
review/edit → saved as an expense + claimable line items.

### 3. Apple Health step sync (read-only)

Web apps can't read HealthKit directly, so each person pushes their own steps
with a **daily iOS Shortcuts automation** (~2 min to set up):

1. Set `STEPS_WEBHOOK_TOKEN` to a long random string in your env vars and
   redeploy.
2. On the iPhone: **Shortcuts app → Automation → New → Time of Day** (e.g.
   23:30, daily) with these actions:
   1. **Find Health Samples** — type *Steps*, *Today*, group by *Day*
      (returns the day's total).
   2. **Get Contents of URL** — `https://<your-app>/api/steps`, Method
      **POST**, Request Body **JSON**:
      - `name`: your profile name in the app (e.g. `Justin`)
      - `steps`: the Health Samples variable
      - `token`: the value of `STEPS_WEBHOOK_TOKEN`
3. Turn off "Ask Before Running". Steps then appear in the Stats tab and the
   👟 leaderboard each night. Dates outside the trip are ignored.

### 4. Vercel deploy

Set all env vars from `.env.example` in the Vercel project (`GEMINI_API_KEY`,
`STEPS_WEBHOOK_TOKEN`, and the Supabase pair at minimum). Everything else is a
standard Next.js deploy.

## Project structure

```
app/
  layout.tsx            # root layout, PWA meta, fonts, service-worker register
  page.tsx              # provider + app root
  globals.css           # Tailwind + design tokens
  api/scan-receipt/     # Gemini receipt → JSON endpoint
  api/steps/            # Apple Health (iOS Shortcut) step webhook
components/
  AppRoot.tsx           # loading / gate / shell switch
  WelcomeGate.tsx       # one-time name login
  AppShell.tsx          # four top tabs
  TripDataProvider.tsx  # data layer: Supabase OR localStorage demo + realtime
  ServiceWorkerRegister.tsx
  tabs/                 # ItineraryTab, PhotosTab, FinanceTab, StatsTab
  itinerary/            # ItineraryCard, PolaroidCarousel, AddCardSheet
  finance/              # RateSettings, ExpenseCard, sheets for receipt/expense
  ui/                   # Avatar, Sheet, TabHeader, DayPicker, TimeWheel
lib/
  supabase.ts           # client + isSupabaseConfigured
  types.ts              # domain types (mirror the SQL schema)
  trip.ts               # fixed trip days / destinations / date mapping
  currency.ts           # GBP conversion, 2-dp rounding, equal split
  settle.ts             # net balances (incl. receipt claims) + transfer minimization
  stats.ts              # stat categories, totals, photo-tag counts
  image.ts              # WebP compression (≤1200px), save-to-device helper
  avatar.ts, demo.ts    # avatar colors, demo seed data
supabase/
  schema.sql            # fresh-install database + storage setup
  migration-v2.sql      # upgrade an existing v1 database
public/                 # manifest.json, sw.js, icons
```

## Notes

- All money math funnels through `round2()` to avoid floating-point drift;
  equal splits self-correct the last share, and receipt service charge/tax is
  spread proportionally across claimed items.
- Settlement counts unclaimed receipt items against the payer until someone
  claims them, so balances always add up mid-claiming.
- RLS policies are fully public (no auth) for easy group access — tighten them
  if you later add Supabase Auth.
