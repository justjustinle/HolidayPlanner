# Multi-tenant (Google auth + trips) — rollout guide

This app is being taken from a single hard-coded trip with no auth to a
multi-tenant model: **Google accounts** own and join **trips**, and every row
is trip-scoped. The work ships in phases behind flags so the live beta app is
never broken by a half-landed change.

- **Phase 1 (migration v5):** trip-scoped schema + backfill. No behaviour change.
- **Phase 2 (migration v6):** Google OAuth + membership + RLS lockdown. Dormant
  behind `NEXT_PUBLIC_AUTH_ENABLED` until you complete the setup below.
- **Phase 3:** de-hardcodes the trip (TripContext, dynamic currencies). Still
  single-trip UX.
- **Phase 4 (migration v7):** multi-trip UI (My Trips, create wizard, join by
  code). Auth-on only; the auth-off single-trip build is unchanged.
- **Phase 5 (migration v8):** destination date ranges, per-trip currencies, and
  automatic invite links with a branded invite landing page.
- **Phase 6 (migrations v9–v10):** invite UUID compatibility and reversible
  leave/rejoin membership state.
- **Phase 7 (migration v11):** safe editing of trip dates, destinations, and
  currency lists from the hamburger menu.
- **Phase 8 (migration v12):** mandatory destination countries with optional
  cities and city-first display fallback.

## Verification status

Everything auth/RLS-related is **code-complete but unverified in CI** — the dev
sandbox blocks direct Supabase/Google egress, so it can only be exercised on a
Vercel preview. What *was* verified here: `tsc --noEmit`, `next build`, the
settle/notifications unit tests, and demo mode (auth off) still boots.

Verify Phase 2 on a preview deploy before enabling in production.

## Phase 1 — apply now (safe, no behaviour change)

1. Supabase SQL Editor → run `supabase/migration-v5-multitrip-phase1.sql`.
2. Deploy the branch. `ACTIVE_TRIP_ID` in `lib/activeTrip.ts` must equal the
   seeded trip uuid (`11111111-1111-1111-1111-111111111111`).

Every new `trip_id` column is defaulted to the migrated trip, so the currently
deployed (pre-Phase-1) code keeps working during the window between applying
the migration and shipping the code.

## Phase 2 — enable auth (do all three together)

Applying migration v6 without a signed-in session locks every anon request out
(that's the point of RLS). So do these as one change:

### 1. Google Cloud Console (manual — cannot be scripted from here)

- Create an OAuth 2.0 Client ID (type: Web application).
- Authorized JavaScript origins: `https://holiday-planner-ruby.vercel.app`,
  `http://localhost:3000`.
- Authorized redirect URI: your Supabase callback,
  `https://wvgulynvhgyzuecysocx.supabase.co/auth/v1/callback`.
- Copy the client ID + secret.

### 2. Supabase dashboard

- Authentication → Providers → Google → enable, paste client ID + secret.
- Authentication → Providers → Email → keep email sign-ins and automatic user
  creation enabled.
- Authentication → URL Configuration → add `https://holiday-planner-ruby.vercel.app/auth/callback`
  and `http://localhost:3000/auth/callback` to the redirect allow-list.
- Authentication → Email Templates → Magic Link: the default
  `{{ .ConfirmationURL }}` template works with the browser PKCE callback. If
  using a direct token-hash template, use:

  ```html
  <h2>Sign in to Yarn</h2>
  <p>This one-time link expires shortly.</p>
  <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to Yarn</a></p>
  ```

  `AuthProvider` always supplies a callback URL with a `next` query parameter,
  so appending the token hash with `&` is intentional.

### 3. Env vars (Vercel + GitHub Actions)

- `NEXT_PUBLIC_AUTH_ENABLED=true`
- `SUPABASE_SERVICE_ROLE_KEY=…` (Supabase → Project Settings → API → service_role).
  The server routes (`/api/notifications/*`) use it to bypass RLS. **Never** ship
  it to the client — it has no `NEXT_PUBLIC_` prefix on purpose.

### 4. Migration

- Run `supabase/migration-v6-auth-rls.sql`, then `supabase/migration-v7-multitrip-ui.sql`,
  `supabase/migration-v8-trip-creation-invites.sql`,
  `supabase/migration-v9-fix-trip-invite-uuid.sql`, and
  `supabase/migration-v10-leave-trip.sql`, then
  `supabase/migration-v11-edit-trip.sql`, then
  `supabase/migration-v12-country-city-destinations.sql`
  in the SQL Editor. (v7 adds the `create_trip` + `claimable_members` RPCs the
  multi-trip UI calls; v8 adds `create_trip_v2`, automatic invite generation,
  and the public-safe invite preview RPC; v10 preserves historical traveler
  data when someone leaves and supports restoring that membership on rejoin.)

### 5. Bootstrap the trip owner

The migrated members start unclaimed with `role='member'`. After you sign in
with Google and claim your member (the gate shows the roster), promote yourself:

```sql
update profiles
   set role = 'owner'
 where trip_id = '11111111-1111-1111-1111-111111111111'
   and user_id = auth.uid();  -- run while signed in, or match on your name
```

Invite the other four beta travellers to sign in and claim their existing member
row (their expense/photo history follows the claim). Trips created after v8
automatically receive a unique invite code and link. For the migrated beta trip,
create its one legacy invite manually:

```sql
insert into trip_invites (trip_id, code)
values ('11111111-1111-1111-1111-111111111111', 'THAILAND2026');
```

## Rollback

- To disable auth without reverting code: set `NEXT_PUBLIC_AUTH_ENABLED=false`
  and re-open RLS (re-create the `"Allow public access"` policies). The app
  returns to the name-based gate.
- Phase 1 is additive and needs no rollback.

## Known follow-ups

- Storage bucket stays public-read this phase; signed URLs are a separate task.
- `push_subscriptions` stays keyed by `profile_id` (per-trip), not account.
- `base_amount_gbp` keeps its name as a generic base amount (rename deferred).
