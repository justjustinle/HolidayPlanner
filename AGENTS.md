# AGENTS.md — HolidayPlanner ("Yarn" / "Planr")

Tool-agnostic guide for AI coding agents (Claude Code, Codex, Cursor, Jules,
Aider, …) working on this repo. Read this first. Last updated after rewriting
the product model as multi-tenant (users create and manage their own trips).

---

## Working norms

Behavioral defaults for work in this repo.

### Surface uncertainty before coding

- State assumptions explicitly when the task is ambiguous; ask rather than pick silently.
- When multiple reasonable interpretations exist, present them and let the user choose.
- If a simpler approach exists than what was asked for, say so before writing the code.

### Surgical scope

Every changed line should trace to the request.

- Don't reformat, rename, or "improve" code the task didn't touch.
- Remove imports, variables, or functions that your edits orphaned; leave pre-existing dead code alone unless asked.

### Verify against explicit criteria

Reframe vague work as something checkable before starting:

- "Add validation" → write tests for invalid inputs, then make them pass.
- "Fix the bug" → write a reproducing test, then make it pass.
- "Refactor X" → confirm tests pass before and after.

For multi-step work, state a brief plan up front pairing each step with its verification:

```
1. <change> → verify: <check>
2. <change> → verify: <check>
```

---

## 1. What the app is

A **multi-tenant** collaborative travel PWA. Signed-in users create, join, and
manage **their own trips**. Product chrome / branding often says **Yarn**.
Inside a trip there are three tabs: **Itinerary** (day-by-day activities +
photo "memories"), **Expenses** (shared costs, receipt scanning, settle-up),
**Stats** ("Trip Olympics" counters + leaderboards).

Constraints that shape every design decision:
- **Many trips, many users.** Trip identity (name, dates, destinations, currencies,
  accents) lives in the database: `trips`, `trip_days`, `trip_currencies`. There
  is **no single product trip**. Do not hard-code a trip title, date span,
  destination list, FX pair, or trip id into UI, notifications, or new schema.
- **Auth.** Account = a Supabase Auth user (`users` mirrors `auth.users`).
  Membership = a `profiles` row on a trip (`user_id` links the account; `role`
  is `owner` | `member`). One account can belong to many trips. Sign-in is
  Google or email magic link. RLS is membership-scoped (not public). Flag:
  `NEXT_PUBLIC_AUTH_ENABLED`. Rollout notes: `docs/MULTI_TENANT.md`.
- **Create / join / leave.** Create via `create_trip_v3` (name, owner display
  name, home currency, destination country+city date ranges, destination
  currencies). Join via invite code (`trip_invites`, `/join/[code]`, RPC
  `join_trip`). Leave is reversible (`leave_trip`; `profiles.left_at`). Owners
  can edit a trip (`update_trip_v3`).
- **Demo / auth-off fallback only.** With no Supabase env vars the app runs on
  `localStorage` (`lib/demo.ts`). With auth off it still uses a name-based
  Welcome Gate and a **legacy fallback** trip in `lib/trip.ts` /
  `lib/activeTrip.ts`. Those constants are **not** the product model — do not
  extend them. Live trips always come from `TripDataProvider` (`trip`,
  `tripDays`, `currencies`, `activeTripId`).
- **Almost all writes are client-side** via `TripDataProvider` (Supabase client
  with the signed-in session). The only server routes are `/api/scan-receipt`
  and `/api/notifications/*`.
- After any write the app calls `refetchAll()`; realtime subscriptions also
  refetch on row changes — the UI updates without a hard refresh.

Auth-on flow (`AppRoot`): sign in → **My Trips** (pick / create / join) → claim
membership if needed → `AppShell` for the open trip. Active trip id is stored
per device in `localStorage` (`active_trip_id`).

## 2. Stack

Next.js 14.2 (App Router) · React 18 · TypeScript · Tailwind 3 · Supabase
(Postgres 17 + Auth + Storage + Realtime) · `web-push` · custom zero-dep
service worker. Deployed on Vercel (Hobby).

## 3. Infrastructure

- **Repo:** `justjustinle/HolidayPlanner` (public)
- **Default branch:** `claude/itinerary-app-design-brepuv` — base for PRs, and what Vercel deploys to production.
- **Vercel:** team `justjustinles-projects` (`team_ZKvomPExwcUqaEfOpMI2LGSu`), project `holiday-planner` (`prj_TqOHN6tShUigSwBXxrNx8kbF6j2y`). Production: **holiday-planner-ruby.vercel.app**. (`vercel.json` sets `"framework": "nextjs"` even though Vercel's auto-detect metadata says "vite".)
- **Supabase (ACTIVE):** "HolidayPlanr", ref `wvgulynvhgyzuecysocx`, eu-central-2. The other project `cjjzcfoorhpfrucyqhvv` is NOT used — ignore it.
- **Storage:** public bucket **`memories`** (`photos/`, `avatars/`, `receipts/`, `expenses/`).
- Secrets (Supabase anon + service-role keys, VAPID keys, `CRON_SECRET`, Google OAuth) live in Vercel env + GitHub Actions secrets — **never commit them**. `SUPABASE_SERVICE_ROLE_KEY` is server-only (notifications bypass RLS); it must not get a `NEXT_PUBLIC_` prefix.

## 4. Data model (Supabase `public` schema)

`supabase/schema.sql` is the **original single-trip snapshot** — do not treat it
as current. Source of truth is the migration chain: `migration-v2.sql` …
`migration-v16-checklist.sql` (multi-tenant starts at **v5**; auth/RLS at **v6**;
create/join UI at **v7–v8**; leave at **v10**; edit trip at **v11**;
country+city destinations at **v12**).

Every content row is trip-scoped (`trip_id` → `trips.id`).

- **users** — public mirror of `auth.users` (`id, email, display_name, avatar_url`), kept in sync by trigger.
- **trips** — `id, name, start_date, end_date, base_currency, created_by→users, created_at`
- **trip_days** — `id, trip_id, day_number, date, destination` (display label = city or country), `country` (required), `city` (optional), `accent_hex`. Unique `(trip_id, day_number)`.
- **trip_currencies** — `(trip_id, code)` PK, `symbol, rate_per_base` (nullable until the group sets FX). Base-currency row has rate 1. Replaces hard-coded FX maps for live trips.
- **trip_invites** — `id, trip_id, code` (unique), `created_by, expires_at, revoked, created_at`. Public preview: RPC `resolve_trip_invite`.
- **profiles** — trip members: `id, name` (unique **per trip**, not globally), `avatar_url, trip_id, user_id` (null until claimed), `role` (`owner` | `member`), `left_at` (null = active). Content FKs (`paid_by_id`, etc.) point here.
- **trip_settings** — **legacy** single-row FX (`vnd_per_gbp, thb_per_gbp`). Still read as a demo/fallback; new work uses `trip_currencies`.
- **itinerary_items** — `id, trip_id, day_number, time_label, end_time_label (nullable), title, location, notes, photo_url (legacy), created_at`
- **photos** — `id, trip_id, activity_id→itinerary_items, url, uploaded_by_id, tagged_user_ids[], created_at`
- **expenses** — `id, trip_id, activity_id (legacy, nullable), label, day_number, kind, local_amount, local_currency, base_amount_gbp, paid_by_id, image_url, is_upcoming, payment_date, created_at`
  - `kind` = **`'manual' | 'receipt' | 'settlement'`** (plain text, **no CHECK constraint** — new kinds need no migration)
  - ⚠️ Column names: **`local_amount` / `base_amount_gbp` / `paid_by_id` / `label`** — NOT `amount` / `paid_by` / `description`. There is **no `is_settlement`**. `base_amount_gbp` is the amount in the **trip's `base_currency`** (name kept; rename deferred).
- **expense_splits** — `id, trip_id, expense_id, user_id, amount_owed` (it's **`amount_owed`**, not `amount`)
- **receipts** — `id, trip_id, expense_id, merchant, image_url, created_at`
- **receipt_items** — `id, trip_id, receipt_id, name, quantity, local_amount, claimed_by_id (null until claimed), created_at`
- **checklist_items** — trip-scoped prep list (`id, trip_id, label, is_done, created_by_id, completed_by_id, completed_at, sort_order`) — not day/activity linked
- **stat_entries** — `id, trip_id, user_id, day_number, category, count` (poop/drink/mosquito/coffee/cards; cumulative, day_number always 1)
- **activity_events** — `id, trip_id` (uuid of the trip), `event_type, actor_id, recipient_id (null=broadcast), payload jsonb, created_at`
- **push_subscriptions** — `id, profile_id, endpoint (unique), p256dh, auth, created_at` (one per device; keyed by membership, not account)
- **notification_state** — `(profile_id, trip_id)` PK, `last_seen_at, last_notified_at`

**RPCs (SECURITY DEFINER):** `create_trip_v3`, `update_trip_v3`, `join_trip`,
`leave_trip`, `claim_member`, `resolve_trip_invite`. Older `create_trip` /
`create_trip_v2` / `update_trip_v2` remain for compatibility — new UI uses v3.

## 5. Key files

**lib/**
- `trip.ts` — `TripDay` shape + helpers: `tripDayFromRow`, `formatTripDate`, `rangeLabelFromDays`, `dayNumberForDateInTrip`, `dayByNumber(n, days)`. **`TRIP_DAYS` / `TRIP_TITLE` / `tripDateRangeLabel()` / `dayNumberForDate` are demo/auth-off fallbacks only** — never use them for a live trip; pass `trip` / `tripDays` from context.
- `activeTrip.ts` — `ACTIVE_TRIP_ID` is the migrated seed uuid used when auth is off. Auth-on active trip is whatever the user opened (`active_trip_id` in localStorage).
- `authConfig.ts` — `AUTH_ENABLED` from `NEXT_PUBLIC_AUTH_ENABLED`.
- `countries.ts` — `COUNTRY_OPTIONS` + city→country / flag lookup for create/edit and the header flag.
- `createDrafts.ts` — persisted create-trip wizard draft.
- `settle.ts` — `computeNetBalances` (net = paid − owed; manual splits + receipt claims), `minimizeTransfers` (greedy "who pays whom"), `totalSpend` (excludes settlements), `computeIncurredByUser` (per-person share of group spend), `isUpcomingPending` / `expensesIncludedInBalances` (deferred upcoming payments), `listSettlements`
- `wrapped.ts` / `wrappedLoad.ts` — Trip Wrapped recap assembly + server loader for `/trip/[id]/wrapped` (per-trip id in the route)
- `currency.ts` — `toBase` / `symbolFor` / `round2` / `splitEqually` against the trip's `trip_currencies`. `toGbp` + `defaultCurrencies` are the legacy VND/THB/GBP fallback.
- `types.ts` — domain types; `Trip`, `TripCurrency`, `Profile` (with `trip_id` / `user_id` / `role` / `left_at`), `ExpenseKind`, `SETTLEMENT_LABEL`, `Transfer`, `SettledPayment`, `CreateTripResult`, `InvitePreview`
- `supabase.ts` — client + `isSupabaseConfigured` + `SUPABASE_BUCKET`
- `notifications/{config,client,server}.ts` — see §7. Config still exports a leftover `TRIP_ID` default; dispatch/cron iterate real trip ids from `notification_state`.
- `stats.ts` — `COUNTER_CATEGORIES` / `ALL_LEADERBOARD_CATEGORIES` (labels only — **no emoji**), `STATS_DAY`, `statFor`, `statTotals`, `photoUploadCounts`
- `time.ts` — 24h clock helpers + `timelineGapPx` (capped vertical spacing between timeline rows)
- `image.ts`, `demo.ts`, `avatar.ts`, `motion.ts` (durations/easing + `hapticLight`)

**components/**
- `AuthProvider.tsx` — Google + email magic-link session; `account` is the signed-in identity (not a trip member).
- `AppRoot.tsx` — loading / Welcome Gate / My Trips / AppShell.
- `trips/MyTripsScreen.tsx` — pick, create, join-by-code, leave.
- `trips/CreateTripSheet.tsx` — create + edit wizard (destinations, dates, currencies, accent palette).
- `TripDataProvider.tsx` — the data spine: active trip + all state + every mutation (`createTrip`, `updateTrip`, `joinTripByCode`, `leaveTrip`, `addItineraryItem`, `addPhotos`, `addExpense`, `updateExpense`, `addReceiptExpense`, `setItemClaim`, `deleteExpense`, `settleUp`, `setStat`, …), `recordActivity` (fires notification events), mark-seen effect. Queries always `.eq('trip_id', activeTripId)`.
- `AppShell.tsx` — bottom tab bar; active tab uses `var(--city-accent)`; sliding accent indicator (320ms ease); owns itinerary day selection (persists last pill in `localStorage`; snaps to device-local today when it matches a trip pill); app surface uses `.city-tint`
- `tabs/ItineraryTab.tsx` — sets `--city-accent` from the **selected day's** `accentHex` (from `tripDays`); filled "+ Add activity" (solid accent + cream text); timeline rows with spacing from `timelineGapPx`
- `tabs/FinanceTab.tsx` — total, add actions, FX rates (`trip_currencies`), collapsible expense list, "Who pays whom" (tap outstanding → settle) + collapsible green settled log, balances
- `tabs/StatsTab.tsx` — Lucide icon badges + ghost +/- counters + leaderboard rank chips; all accents via `var(--city-accent)` (see §6 / §11)
- `ui/TabHeader.tsx` — **Itinerary:** shared `grid-cols-[40px_1fr]` trip chrome (hamburger; `trip.name`; calendar + `rangeLabelFromDays(tripDays)`; users + facepile; country flag from the selected day's country). **Expenses & Stats:** hamburger + section title, Yarn logo top-right. Drawer for account / trip actions (invite, edit trip, edit name).
- `ui/DayPicker.tsx` — horizontal day pills from the **current trip's** `tripDays` (see §10)
- `ui/TravelerFacepile.tsx` — avatar stack only (Users icon lives in the header rail)
- `ui/` — also `AppDrawer`, `ConfirmDialog`, `Avatar`, `Sheet`, `Flag`, `TimeWheel`, `PlaneJourney`, `WhoIsGoingSheet`, `InviteFriendsSheet`, `EditNameSheet`
- `itinerary/` — `ItineraryCard` (tap opens View activity sheet; photo preview thumb on card), `ViewActivitySheet` (photos / edit / delete), `YarnTimelineRail` (dashed rail + diamond activity nodes / now circle), `NowMarker`, `AddCardSheet`, `MemoriesModal`
- `lib/motion.ts` — shared motion durations/easing + `hapticLight()` for select feedback
- `finance/` — `ExpenseCard`, `LogExpenseSheet`, `UploadReceiptSheet`, `RateSettings`
- `WelcomeGate.tsx`, `ServiceWorkerRegister.tsx`, `brand/YarnLogo.tsx`

**app/** — `page.tsx` (AuthProvider → TripDataProvider → AppRoot), `layout.tsx`, `globals.css` (`--city-accent`, `.city-tint`), `auth/callback/page.tsx`, `join/[code]/page.tsx`, `trip/[id]/wrapped/`, `api/scan-receipt/route.ts`, `api/notifications/{subscribe,dispatch,cron}/route.ts`
**public/** — `sw.js` (offline cache + push + notificationclick), `manifest.json`, `icons/`

## 6. City theming (accent token — critical)

`ItineraryTab` writes the selected day's `accentHex` (from `trip_days.accent_hex`)
to CSS var **`--city-accent`**. Accents are assigned per destination when the
trip is created/edited (rotating palette in `CreateTripSheet`); they are **trip
data**, not a global city map. Do not hard-code a destination or hex as "the"
app theme.

**Rules for UI work:**
- Prefer **`var(--city-accent)`** (and `color-mix` derived from it) for theme highlights. Day pills may use that day's `d.accentHex` for the *selected chip's own destination* (correct — each chip is tied to a day).
- **Never hard-code a destination hex** for page chrome that should follow the active day (Stats, tab bar, icon badges, rank-1 chips, sheet submit, etc.).
- Derived values: accent tint ≈ `color-mix(in srgb, var(--city-accent) 12%, #fdfbf5)`; full-opacity accent for borders / solid primary actions.
- `.city-tint` on the app shell = `color-mix(in srgb, var(--city-accent) 12%, #f7f1e6)`.
- **Member avatar colors** (`lib/avatar.ts`) are identity colors — **not** theme-dependent; do not recolor them to the city accent.
- Solid accent fill is reserved for **primary actions** (e.g. Add activity filled pill; Stats rank-1 chip). Do not use solid city fill for large selected surfaces (selected day pill is white + accent outline).
- Trip identity chrome (title, dates, facepile, destination · day label) stays **flat** on `.city-tint` — no cards behind them.

## 7. Notifications (built; env configured — verify + enable)

Batched web-push digests for ambient activity, **per trip**.
- **Rule:** push when EITHER ≥5 unnotified events for a recipient OR oldest unnotified event > 2h. Never notified about own actions; opening the app advances `last_seen_at` so seen events never push. Events from one trip must not notify members of another.
- **Config:** `lib/notifications/config.ts` — `BATCH_MIN_COUNT=5`, `BATCH_MAX_AGE_MINUTES=120`, `EVENT_CONFIG` classifying types `batched` (expense_added, photo_added, activity_added) vs `immediate` (expense_split_added). Do not introduce a new global trip id/name constant; use the row's `trip_id` (and the trip's name from `trips` when a label is needed). Leftover `TRIP_ID` / `TRIP_NAME` exports are defaults for auth-off / isolated E2E only.
- **Routes:** `/api/notifications/subscribe`, `/dispatch` (immediate + count rule, poked by client after writes), `/cron` (age rule, Bearer `CRON_SECRET`; `dispatchAllTrips` walks every trip with `notification_state` rows). Server routes use the service role when auth/RLS is on.
- **Cron:** `.github/workflows/notifications-cron.yml` hits `/cron` every 15 min (Vercel Hobby crons are daily-only). `notifications-e2e.yml` + `scripts/notifications-e2e.mjs` = manual smoke test.
- **Subscribe UI:** "Enable notifications" in the avatar / hamburger drawer menu.

**Status:** Both stores are configured — GitHub Actions secrets (`APP_URL`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) and the Vercel env vars (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`; `CRON_SECRET` matches the GitHub secret). A **redeploy after adding the vars is required** for the inlined `NEXT_PUBLIC_` public key to take effect. Confirm end-to-end by running the `notifications-e2e` workflow (expect 13/13; an earlier run was 3/13 only because the Vercel vars were missing). Then enable per device from the avatar menu (iOS needs the PWA installed to the home screen, 16.4+).

## 8. Settle Up (live)

Peer-to-peer debt clearing, fitted to the derived-balance model. Always computed
inside the **open trip** (that trip's expenses + members only).
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

Pills are rendered from the **current trip's** `tripDays` (count, labels, and
accents vary per trip). Do not assume a fixed 13-day list.

- **Selected:** solid white/`bg-cream-card`, `1px` solid day accent border (that day's `accentHex`), **bold dark** date text, muted second line + colored destination dots.
- **Unselected:** `bg-transparent` (page / city-tint background), **no** shadow, `1px border-black/25`, dark date text, muted second line, colored destination dots.
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

Shared grid: **`grid-cols-[40px_1fr]`** (do not nest date/facepile in a second icon column). Title, dates, and flags are **data from the open trip**, not constants.

| Row | Col 1 (40px, icon centered) | Col 2 |
|-----|-----------------------------|-------|
| 1 | Hamburger | `trip.name` |
| 2 | Calendar | `rangeLabelFromDays(tripDays)` (ordinal suffixes, e.g. `28th Aug – 9th Sep`) |
| 3 | Users | Facepile |

A country flag for the **selected day's** country sits beside the date/facepile
block (not a hard-coded pair of national flags).

⚠️ Nesting meta rows inside `col-start-2` with a separate `14px` icon grid **misaligns** calendar/users vs hamburger and title vs dates — that was the header regression fixed by the shared 40px rail.

## 13. Conventions & gotchas

- **No new hard-coded trip identity.** Do not add trip titles, destination lists, date anchors, FX pairs, or trip UUIDs as product constants. Read `trip` / `tripDays` / `currencies` / `activeTripId` from `TripDataProvider`. Leftovers in `lib/trip.ts`, `lib/activeTrip.ts`, and `lib/notifications/config.ts` exist only for demo / auth-off / E2E — do not grow them.
- **Queries are trip-scoped.** New selects/inserts must include `trip_id` (the open trip). RLS assumes membership; server routes that run without a user session need the service role.
- **Account ≠ member.** UI that is "who is on this trip" uses `profiles`. UI that is "who is signed in" uses `useAuth().account`. Claiming links them (`claim_member`).
- **Branching:** develop on a feature branch; open PRs as **draft** with base = default branch `claude/itinerary-app-design-brepuv`. After a merge, **reset the feature branch from the freshly-merged default** before the next change. Do not stack unrelated follow-ups on a half-merged branch — incomplete landings caused the header + day-pill regressions.
- **Verify before commit:** implement → `npx tsc --noEmit` (use `./node_modules/.bin/tsc` if `npx tsc` resolves wrong) → drive the real app headless (Playwright via `playwright-core`, Chromium at `/opt/google/chrome/chrome` or `/opt/pw-browsers/chromium`, iPhone viewport ~390×844) → screenshot → then commit/PR.
- **Fast test path:** demo mode — log in as a seed profile (e.g. "Alex") to exercise flows without Supabase. Demo state key: `travel_demo_state_v2`. Multi-trip create/join/RLS cannot be fully proven in demo; those need a signed-in preview (sandbox egress blocks live Supabase from local scripts).
- **Receipt scanning** uses Anthropic (`ANTHROPIC_API_KEY`; models `claude-haiku-4-5` → `claude-sonnet-5`) in `app/api/scan-receipt/route.ts`. (`.env.example` still mentions GEMINI — stale; the code uses Anthropic.)
- Balances use the trip's `base_currency` via `trip_currencies.rate_per_base`. The stored column is still `base_amount_gbp`.
- Times are **24-hour** (`HH:MM`) in storage and display; legacy 12h labels still parse.

## 14. Backlog

- Verify notifications live across **multiple trips**: redeploy (for the inlined VAPID public key) + run the `notifications-e2e` workflow to confirm 13/13 (§7).
- `.env.example` GEMINI → Anthropic tidy-up.
- Retire leftover single-trip fallbacks (`TRIP_DAYS` / `TRIP_TITLE` / `ACTIVE_TRIP_ID` / notification `TRIP_ID`) once auth-on is the only supported path; `schema.sql` still describes the pre-multi-tenant snapshot.
- Per-trip notification **preferences** (mute / important-only) — schema (`notification_state`) accommodates it; UI not built.
- Activity feed only emits add events (no edit/delete events).
- Stats poop icon: custom toilet outline (done).
- Storage bucket stays public-read; signed URLs are a separate task.
