# AGENTS.md — HolidayPlanner ("Yarn" / "Planr")

Tool-agnostic guide for AI coding agents (Claude Code, Codex, Cursor, Jules,
Aider, …) working on this repo. Read this first. Last updated after selected
day pill = white + city accent outline; unselected = page bg + thin black outline.

---

## 1. What the app is

A collaborative travel PWA for one group's **Thailand & Vietnam trip (28 Aug – 9 Sep 2026)**.
Product chrome / branding often says **Yarn**. Three tabs: **Itinerary** (day-by-day
activities + photo "memories"), **Expenses** (shared costs, receipt scanning,
settle-up), **Stats** ("Trip Olympics" counters + leaderboards).

Constraints that shape every design decision:
- **Single-trip.** The trip (days, cities) is hard-coded in `lib/trip.ts`. There is **no `trips` table and no `group_id`**.
- **No auth.** "Members" = all rows in `profiles`. Identity = a profile picked at the Welcome Gate, stored in `localStorage`. Supabase **RLS is intentionally wide open** ("Allow public access" on every table).
- **Demo mode.** With no Supabase env vars the app runs entirely on `localStorage` (`lib/demo.ts`). When `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, it uses real Supabase with realtime sync.
- **Almost all writes are client-side** via `TripDataProvider` (anon Supabase client). The only server routes are `/api/scan-receipt` and `/api/notifications/*`.
- After any write the app calls `refetchAll()`; realtime subscriptions also refetch on row changes — the UI updates without a hard refresh.

## 2. Stack

Next.js 14.2 (App Router) · React 18 · TypeScript · Tailwind 3 · Supabase (Postgres 17 + Storage + Realtime) · `web-push` · custom zero-dep service worker. Deployed on Vercel (Hobby).

## 3. Infrastructure

- **Repo:** `justjustinle/HolidayPlanner` (public)
- **Default branch:** `claude/itinerary-app-design-brepuv` — base for PRs, and what Vercel deploys to production.
- **Vercel:** team `justjustinles-projects` (`team_ZKvomPExwcUqaEfOpMI2LGSu`), project `holiday-planner` (`prj_TqOHN6tShUigSwBXxrNx8kbF6j2y`). Production: **holiday-planner-ruby.vercel.app**. (`vercel.json` sets `"framework": "nextjs"` even though Vercel's auto-detect metadata says "vite".)
- **Supabase (ACTIVE):** "HolidayPlanr", ref `wvgulynvhgyzuecysocx`, eu-central-2. The other project `cjjzcfoorhpfrucyqhvv` is NOT used — ignore it.
- **Storage:** public bucket **`memories`** (`photos/`, `avatars/`, `receipts/`).
- Secrets (Supabase anon key, VAPID keys, `CRON_SECRET`) live in Vercel env + GitHub Actions secrets — **never commit them**.

## 4. Data model (Supabase `public` schema)

Source of truth: `supabase/schema.sql`; migrations in `supabase/migration-v2.sql` and `migration-v3-notifications.sql`.

- **profiles** — `id, name (unique), avatar_url, created_at`
- **trip_settings** — single row (id=1): `vnd_per_gbp, thb_per_gbp` (group FX rates)
- **itinerary_items** — `id, day_number, time_label, end_time_label (nullable), title, location, notes, photo_url (legacy), created_at`
- **photos** — `id, activity_id→itinerary_items, url, uploaded_by_id, tagged_user_ids[], created_at`
- **expenses** — `id, activity_id (legacy, nullable), label, day_number, kind, local_amount, local_currency, base_amount_gbp, paid_by_id, created_at`
  - `kind` = **`'manual' | 'receipt' | 'settlement'`** (plain text, **no CHECK constraint** — new kinds need no migration)
  - ⚠️ Column names: **`local_amount` / `base_amount_gbp` / `paid_by_id` / `label`** — NOT `amount` / `paid_by` / `description`. There is **no `is_settlement`, no `group_id`**.
- **expense_splits** — `id, expense_id, user_id, amount_owed` (it's **`amount_owed`**, not `amount`)
- **receipts** — `id, expense_id, merchant, image_url, created_at`
- **receipt_items** — `id, receipt_id, name, quantity, local_amount, claimed_by_id (null until claimed), created_at`
- **stat_entries** — `id, user_id, day_number, category, count` (poop/drink/mosquito/coffee/cards; cumulative, day_number always 1)
- **activity_events** — `id, trip_id, event_type, actor_id, recipient_id (null=broadcast), payload jsonb, created_at`
- **push_subscriptions** — `id, profile_id, endpoint (unique), p256dh, auth, created_at` (one per device)
- **notification_state** — `(profile_id, trip_id)` PK, `last_seen_at, last_notified_at`

## 5. Key files

**lib/**
- `trip.ts` — `TRIP_DAYS` (13 hard-coded days: city + accent hex + `dateLabel` with ordinal suffixes), `TRIP_TITLE`, `tripDateRangeLabel()` → **"28th Aug – 9th Sep"** (keeps st/nd/rd/th), `dayByNumber`, `defaultDayNumber`, `landingDayNumber` (today match → last stored day → Day 1; key `travel_itinerary_day`), `CURRENCY_SYMBOL`
- `settle.ts` — `computeNetBalances` (net = paid − owed; manual splits + receipt claims), `minimizeTransfers` (greedy "who pays whom"), `totalSpend` (excludes settlements), `listSettlements`
- `currency.ts` — `formatGbp, toGbp, round2, splitEqually`
- `types.ts` — domain types; `ExpenseKind`, `SETTLEMENT_LABEL`, `Transfer`, `SettledPayment`
- `supabase.ts` — client + `isSupabaseConfigured` + `SUPABASE_BUCKET`
- `notifications/{config,client,server}.ts` — see §7
- `stats.ts` — `COUNTER_CATEGORIES` / `ALL_LEADERBOARD_CATEGORIES` (labels only — **no emoji**), `STATS_DAY`, `statFor`, `statTotals`, `photoUploadCounts`
- `time.ts` — 24h clock helpers + `timelineGapPx` (capped vertical spacing between timeline rows)
- `image.ts`, `demo.ts`, `avatar.ts`, `motion.ts` (durations/easing + `hapticLight`)

**components/**
- `TripDataProvider.tsx` — the data spine: all state + every mutation (`addItineraryItem`, `addPhotos`, `addExpense`, `updateExpense`, `addReceiptExpense`, `setItemClaim`, `deleteExpense`, `settleUp`, `setStat`, …), `recordActivity` (fires notification events), mark-seen effect.
- `AppShell.tsx` — bottom tab bar; active tab uses `var(--city-accent)`; sliding accent indicator (320ms ease); owns itinerary day selection (persists last pill in `localStorage`; snaps to device-local today when it matches a trip pill); app surface uses `.city-tint`
- `tabs/ItineraryTab.tsx` — sets `--city-accent` from selected day; filled "+ Add activity" (solid accent + cream text); timeline rows with spacing from `timelineGapPx`- `tabs/FinanceTab.tsx` — total, add actions, FX rates, collapsible expense list, "Who pays whom" (tap outstanding → settle) + collapsible green settled log, balances
- `tabs/StatsTab.tsx` — Lucide icon badges + ghost +/- counters + leaderboard rank chips; all accents via `var(--city-accent)` (see §6 / §11)
- `ui/TabHeader.tsx` — **Itinerary:** shared `grid-cols-[40px_1fr]` trip chrome (hamburger / calendar / users in col 1; title+flags / dates / facepile in col 2). **Expenses & Stats:** hamburger + section title, Yarn logo top-right. Drawer for account actions.
- `ui/DayPicker.tsx` — horizontal day pills (see §10)
- `ui/TravelerFacepile.tsx` — avatar stack only (Users icon lives in the header rail)
- `ui/` — also `AppDrawer`, `ConfirmDialog`, `Avatar`, `Sheet`, `Flag`, `TimeWheel`, `PlaneJourney`, `WhoIsGoingSheet`
- `itinerary/` — `ItineraryCard` (tap opens View activity sheet; photo preview thumb on card), `ViewActivitySheet` (photos / edit / delete), `YarnTimelineRail` (dashed rail + diamond activity nodes / now circle), `NowMarker`, `AddCardSheet`, `MemoriesModal`
- `lib/motion.ts` — shared motion durations/easing + `hapticLight()` for select feedback
- `finance/` — `ExpenseCard`, `LogExpenseSheet`, `UploadReceiptSheet`, `RateSettings`
- `WelcomeGate.tsx`, `ServiceWorkerRegister.tsx`, `brand/YarnLogo.tsx`

**app/** — `page.tsx`, `layout.tsx`, `globals.css` (`--city-accent`, `.city-tint`), `api/scan-receipt/route.ts`, `api/notifications/{subscribe,dispatch,cron}/route.ts`
**public/** — `sw.js` (offline cache + push + notificationclick), `manifest.json`, `icons/`

## 6. City theming (accent token — critical)

`ItineraryTab` writes the selected day's accent to CSS var **`--city-accent`**:
Bangkok gold `#c9992e`, Phuket teal `#2f97a6`, Saigon red `#b0472f`, Nha Trang jade `#3f9b8a`.

**Rules for UI work:**
- Prefer **`var(--city-accent)`** (and `color-mix` derived from it) for theme highlights. Day pills may use that day's `d.accentHex` for the *selected chip's own city* (correct — each chip is tied to a day).
- **Never hard-code gold / Bangkok hex** for page chrome that should follow the active city (Stats, tab bar, icon badges, rank-1 chips, sheet submit, etc.).
- Derived values: accent tint ≈ `color-mix(in srgb, var(--city-accent) 12%, #fdfbf5)`; full-opacity accent for borders / solid primary actions.
- `.city-tint` on the app shell = `color-mix(in srgb, var(--city-accent) 12%, #f7f1e6)`.
- **Member avatar colors** (`lib/avatar.ts`) are identity colors — **not** theme-dependent; do not recolor them to the city accent.
- Solid accent fill is reserved for **primary actions** (e.g. Add activity filled pill; Stats rank-1 chip). Do not use solid city fill for large selected surfaces (selected day pill is white + accent outline).
- Trip identity chrome (title, dates, facepile, "City · Day n" label) stays **flat** on `.city-tint` — no cards behind them.

## 7. Notifications (built; env configured — verify + enable)

Batched web-push digests for ambient activity.
- **Rule:** push when EITHER ≥5 unnotified events for a recipient OR oldest unnotified event > 2h. Never notified about own actions; opening the app advances `last_seen_at` so seen events never push.
- **Config (single source):** `lib/notifications/config.ts` — `TRIP_ID='thailand-vietnam-2026'`, `BATCH_MIN_COUNT=5`, `BATCH_MAX_AGE_MINUTES=120`, `EVENT_CONFIG` classifying types `batched` (expense_added, photo_added, activity_added) vs `immediate` (expense_split_added).
- **Routes:** `/api/notifications/subscribe`, `/dispatch` (immediate + count rule, poked by client after writes), `/cron` (age rule, Bearer `CRON_SECRET`).
- **Cron:** `.github/workflows/notifications-cron.yml` hits `/cron` every 15 min (Vercel Hobby crons are daily-only). `notifications-e2e.yml` + `scripts/notifications-e2e.mjs` = manual smoke test.
- **Subscribe UI:** "Enable notifications" in the avatar / hamburger drawer menu.

**Status:** Both stores are configured — GitHub Actions secrets (`APP_URL`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) and the Vercel env vars (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`; `CRON_SECRET` matches the GitHub secret). A **redeploy after adding the vars is required** for the inlined `NEXT_PUBLIC_` public key to take effect. Confirm end-to-end by running the `notifications-e2e` workflow (expect 13/13; an earlier run was 3/13 only because the Vercel vars were missing). Then enable per device from the avatar menu (iOS needs the PWA installed to the home screen, 16.4+).

## 8. Settle Up (live)

Peer-to-peer debt clearing, fitted to the derived-balance model.
- A settlement is a normal expense row with `kind='settlement'` (`paid_by_id` = debtor) + one `expense_splits` row assigning the full amount to the receiver. **`computeNetBalances` is untouched** — the generic math clears both sides. **No migration** (kind has no CHECK).
- Excluded from `totalSpend`, the Expenses feed, and notifications.
- **UX:** tap an outstanding "who pays whom" card → confirm → logged. Settled payments sit in a collapsed-by-default green "Show Settled Payments (n)" accordion as immutable "X paid Y £Z ✓ PAID" rows. **Full amounts only.** Each is **reversible** (undo deletes the settlement, restores balance).
- Helpers: `settleUp(fromId,toId,amount)` (TripDataProvider), `listSettlements()` (`lib/settle.ts`).

## 9. Itinerary timeline (dashed rail)

- Layout: time column | timeline node | activity card. Rows use `items-stretch`; the rail column `self-stretch`s to the full row height (card + `spacingAfter`).
- Rail: muted **dashed** vertical line (not the old wavy yarn SVG). Activity nodes are solid city-accent **diamonds**; the live "now" marker is an accent **ring + solid inner dot** (subtle ping).
- Segment fills an in-flow `flex-1` spacer and extends `calc(100% + 6px)` past the row bottom to bridge the next node's inset — **no gaps** between nodes.
- Optional end times display as `TO HH:MM` under the start time.
- **View activity:** tap a card opens `ViewActivitySheet` (details + Photos / Edit / Delete). Cards keep a square photo preview thumb with count badge when photos exist — no on-card action icon chrome.

## 10. Day pills (`DayPicker`)

- **Selected:** solid white/`bg-cream-card`, `1px` solid day accent border (gold / teal / lacquer / jade from that day's `accentHex`), **bold dark** date text, muted second line + colored city dots.
- **Unselected:** `bg-transparent` (page / city-tint background), **no** shadow, `1px border-black/25`, dark date text, muted second line, colored city dots.
- Dimensions identical between states (both use 1px borders). Sticky below the trip header (`sticky top-0` with city-tint background). Edge fades unchanged.
- **Add activity:** filled primary CTA — solid day accent background + cream text; same `h-8` rounded-full size as before.
- ⚠️ Do **not** restore tinted selected fill, elevated cream unselected chips, or solid city fill + white text on the selected pill.
## 11. Stats tab (Trip Olympics)

- No emoji. Lucide (or Lucide-matched outline) icons in ~28px circular badges: accent-tint background + `var(--city-accent)` stroke.
- Counter cards: ghost outline +/- (`border-black/25`, transparent fill, accent-tint on press); large serif count; compact padding.
- Leaderboards: serif "Leaderboards" + "Whole trip" chip; rank chips — **1 = solid accent + white numeral**, 2 = silver-grey, 3 = bronze/tan, 4+ = transparent + muted + hairline border; current-user row = accent-tint background + "(you)"; bold serif for the leading score.
- Photo counter stays read-only with caption: "counted from the trip photos you've uploaded".
- Icons map in `StatsTab` (poop uses a custom filled toilet SVG — Lucide has no toilet glyph).

## 12. Trip header (Itinerary)

Shared grid: **`grid-cols-[40px_1fr]`** (do not nest date/facepile in a second icon column).

| Row | Col 1 (40px, icon centered) | Col 2 |
|-----|-----------------------------|-------|
| 1 | Hamburger | `TRIP_TITLE` + Thailand/Vietnam flags |
| 2 | Calendar | `tripDateRangeLabel()` e.g. `28th Aug – 9th Sep` |
| 3 | Users | Facepile |

⚠️ Nesting meta rows inside `col-start-2` with a separate `14px` icon grid **misaligns** calendar/users vs hamburger and title vs dates — that was the header regression fixed by the shared 40px rail.

## 13. Conventions & gotchas

- **Branching:** develop on a feature branch; open PRs as **draft** with base = default branch `claude/itinerary-app-design-brepuv`. After a merge, **reset the feature branch from the freshly-merged default** before the next change. Do not stack unrelated follow-ups on a half-merged branch — incomplete landings caused the header + day-pill regressions.
- **Verify before commit:** implement → `npx tsc --noEmit` (use `./node_modules/.bin/tsc` if `npx tsc` resolves wrong) → drive the real app headless (Playwright via `playwright-core`, Chromium at `/opt/google/chrome/chrome` or `/opt/pw-browsers/chromium`, iPhone viewport ~390×844) → screenshot → then commit/PR.
- **Fast test path:** demo mode — log in as a seed profile (e.g. "Alex") to exercise flows without Supabase. Demo state key: `travel_demo_state_v2`.
- **Receipt scanning** uses Anthropic (`ANTHROPIC_API_KEY`; models `claude-haiku-4-5` → `claude-sonnet-5`) in `app/api/scan-receipt/route.ts`. (`.env.example` still mentions GEMINI — stale; the code uses Anthropic.)
- Balances are GBP; local amounts convert via `trip_settings` FX rates.
- Sandbox note: the dev environment's network policy blocks direct Supabase/Vercel egress from local scripts, so live-Supabase E2E must run from GitHub Actions.
- Times are **24-hour** (`HH:MM`) in storage and display; legacy 12h labels still parse.

## 14. Backlog

- Verify notifications live: redeploy (for the inlined VAPID public key) + run the `notifications-e2e` workflow to confirm 13/13 (§7).
- `.env.example` GEMINI → Anthropic tidy-up.
- Per-trip notification **preferences** (mute / important-only) — schema (`notification_state`) accommodates it; UI not built.
- Activity feed only emits add events (no edit/delete events).
- Stats poop icon: custom toilet outline (done).
