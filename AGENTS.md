# AGENTS.md — HolidayPlanner ("Planr")

Tool-agnostic guide for AI coding agents (Claude Code, Codex, Cursor, Jules,
Aider, …) working on this repo. Read this first. Last updated after the
"Settle Up" feature (PR #16).

---

## 1. What the app is

A collaborative travel PWA for one group's **Thailand & Vietnam trip (28 Aug – 9 Sep 2026)**.
Three tabs: **Itinerary** (day-by-day activities + photo "memories"), **Expenses**
(shared costs, receipt scanning, settle-up), **Stats** ("Trip Olympics" counters).

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
- **itinerary_items** — `id, day_number, time_label, title, location, photo_url (legacy), created_at`
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
- `trip.ts` — `TRIP_DAYS` (13 hard-coded days: city + accent hex + `dateLabel` with ordinal suffixes), `dayByNumber`, `defaultDayNumber`, `CURRENCY_SYMBOL`
- `settle.ts` — `computeNetBalances` (net = paid − owed; manual splits + receipt claims), `minimizeTransfers` (greedy "who pays whom"), `totalSpend` (excludes settlements), `listSettlements`
- `currency.ts` — `formatGbp, toGbp, round2, splitEqually`
- `types.ts` — domain types; `ExpenseKind`, `SETTLEMENT_LABEL`, `Transfer`, `SettledPayment`
- `supabase.ts` — client + `isSupabaseConfigured` + `SUPABASE_BUCKET`
- `notifications/{config,client,server}.ts` — see §7
- `image.ts`, `demo.ts`, `stats.ts`, `time.ts`, `avatar.ts`

**components/**
- `TripDataProvider.tsx` — the data spine: all state + every mutation (`addItineraryItem`, `addPhotos`, `addExpense`, `updateExpense`, `addReceiptExpense`, `setItemClaim`, `deleteExpense`, `settleUp`, `setStat`, …), `recordActivity` (fires notification events), mark-seen effect.
- `AppShell.tsx` — bottom tab bar; app surface uses `.city-tint`
- `tabs/ItineraryTab.tsx` — sets `--city-accent` from selected day; inline "+ Add activity"; new activities auto-assigned to the current day
- `tabs/FinanceTab.tsx` — total, add actions, FX rates, collapsible expense list, "Who pays whom" (tap outstanding → settle) + collapsible green settled log, balances
- `tabs/StatsTab.tsx`
- `ui/` — `TabHeader` (title+flags+avatar one centered row), `ConfirmDialog` (tone: danger|primary), `Avatar`, `DayPicker`, `Sheet`, `Flag`, `TimeWheel`, `PlaneJourney`
- `itinerary/` — `ItineraryCard`, `PolaroidCarousel`, `AddCardSheet`
- `finance/` — `ExpenseCard`, `LogExpenseSheet`, `UploadReceiptSheet`, `RateSettings`
- `WelcomeGate.tsx`, `ServiceWorkerRegister.tsx`

**app/** — `page.tsx`, `layout.tsx`, `globals.css` (`--city-accent`, `.city-tint`), `api/scan-receipt/route.ts`, `api/notifications/{subscribe,dispatch,cron}/route.ts`
**public/** — `sw.js` (offline cache + push + notificationclick), `manifest.json`, `icons/`

## 6. City theming

`ItineraryTab` writes the selected day's accent to CSS var `--city-accent`:
Bangkok gold `#c9992e`, Phuket teal `#2f97a6`, Saigon red `#b0472f`, Nha Trang jade `#3f9b8a`. Drives active day chip, Add button, sheet submit button, tab-bar highlight, and the pastel app background (`.city-tint` = `color-mix(in srgb, var(--city-accent) 12%, cream)`).

## 7. Notifications (built, NOT yet live)

Batched web-push digests for ambient activity.
- **Rule:** push when EITHER ≥5 unnotified events for a recipient OR oldest unnotified event > 2h. Never notified about own actions; opening the app advances `last_seen_at` so seen events never push.
- **Config (single source):** `lib/notifications/config.ts` — `TRIP_ID='thailand-vietnam-2026'`, `BATCH_MIN_COUNT=5`, `BATCH_MAX_AGE_MINUTES=120`, `EVENT_CONFIG` classifying types `batched` (expense_added, photo_added, activity_added) vs `immediate` (expense_split_added).
- **Routes:** `/api/notifications/subscribe`, `/dispatch` (immediate + count rule, poked by client after writes), `/cron` (age rule, Bearer `CRON_SECRET`).
- **Cron:** `.github/workflows/notifications-cron.yml` hits `/cron` every 15 min (Vercel Hobby crons are daily-only). `notifications-e2e.yml` + `scripts/notifications-e2e.mjs` = manual smoke test.
- **Subscribe UI:** "Enable notifications" in the avatar menu.

**Pending go-live:** GitHub Actions secrets are set; the Vercel env vars are not, so `/dispatch` and `/cron` return 503. To finish: set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET` in Vercel (CRON_SECRET must match the GitHub secret), redeploy (the `NEXT_PUBLIC_` var is inlined at build), then re-run the `notifications-e2e` workflow.

## 8. Settle Up (live)

Peer-to-peer debt clearing, fitted to the derived-balance model.
- A settlement is a normal expense row with `kind='settlement'` (`paid_by_id` = debtor) + one `expense_splits` row assigning the full amount to the receiver. **`computeNetBalances` is untouched** — the generic math clears both sides. **No migration** (kind has no CHECK).
- Excluded from `totalSpend`, the Expenses feed, and notifications.
- **UX:** tap an outstanding "who pays whom" card → confirm → logged. Settled payments sit in a collapsed-by-default green "Show Settled Payments (n)" accordion as immutable "X paid Y £Z ✓ PAID" rows. **Full amounts only.** Each is **reversible** (undo deletes the settlement, restores balance).
- Helpers: `settleUp(fromId,toId,amount)` (TripDataProvider), `listSettlements()` (`lib/settle.ts`).

## 9. Conventions & gotchas

- **Branching:** develop on a feature branch; open PRs as **draft** with base = default branch `claude/itinerary-app-design-brepuv`. After a merge, **reset the feature branch from the freshly-merged default** before the next change.
- **Verify before commit:** implement → `npx tsc --noEmit` → drive the real app headless (Playwright via `playwright-core`, Chromium at `/opt/pw-browsers/chromium`, iPhone viewport) → screenshot → then commit/PR.
- **Fast test path:** demo mode — log in as a seed profile (e.g. "Alex") to exercise flows without Supabase.
- **Receipt scanning** uses Anthropic (`ANTHROPIC_API_KEY`; models `claude-haiku-4-5` → `claude-sonnet-5`) in `app/api/scan-receipt/route.ts`. (`.env.example` still mentions GEMINI — stale; the code uses Anthropic.)
- Balances are GBP; local amounts convert via `trip_settings` FX rates.
- Sandbox note: the dev environment's network policy blocks direct Supabase/Vercel egress from local scripts, so live-Supabase E2E must run from GitHub Actions.

## 10. Backlog

- Finish notifications go-live (§7).
- `.env.example` GEMINI → Anthropic tidy-up.
- Per-trip notification **preferences** (mute / important-only) — schema (`notification_state`) accommodates it; UI not built.
- Activity feed only emits add events (no edit/delete events).
