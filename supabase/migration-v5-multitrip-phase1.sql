-- =============================================================================
-- Migration v5 (Phase 1 of multi-tenant) — run ONCE in the Supabase SQL Editor.
--
-- Introduces the multi-trip data model WITHOUT changing behaviour: it creates
-- trips / trip_days / trip_currencies, backfills the existing single trip, and
-- stamps every content row with a trip_id.
--
-- Deploy-safe: every new trip_id column has a DEFAULT of the migrated trip, so
-- the currently-deployed code (which does not yet send trip_id) keeps inserting
-- successfully during the window between applying this migration and shipping
-- the Phase 1 app code. RLS stays wide open here — auth lockdown is Phase 2.
--
-- The migrated trip uses a FIXED uuid so app code can reference it as a
-- constant (lib/activeTrip.ts → ACTIVE_TRIP_ID) until the trip becomes dynamic
-- in Phase 3.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- The fixed id for the existing Thailand & Vietnam trip.
--   11111111-1111-1111-1111-111111111111
-- Keep this in sync with lib/activeTrip.ts.

-- 1. TRIPS ---------------------------------------------------------------------
create table if not exists trips (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  base_currency varchar(3) not null default 'GBP',
  created_by uuid, -- FK to users(id) added in Phase 2
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into trips (id, name, start_date, end_date, base_currency)
values (
  '11111111-1111-1111-1111-111111111111',
  'Thailand & Vietnam',
  '2026-08-28',
  '2026-09-09',
  'GBP'
)
on conflict (id) do nothing;

-- 2. TRIP_DAYS — replaces the hard-coded TRIP_DAYS array in lib/trip.ts. --------
-- date drives the client-side label (weekday + ordinal suffix); accent_hex is
-- the per-day city accent written into --city-accent.
create table if not exists trip_days (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  day_number integer not null,
  date date not null,
  destination text not null,
  accent_hex varchar(7) not null,
  unique (trip_id, day_number)
);

insert into trip_days (trip_id, day_number, date, destination, accent_hex)
values
  ('11111111-1111-1111-1111-111111111111',  1, '2026-08-28', 'Bangkok',   '#c9992e'),
  ('11111111-1111-1111-1111-111111111111',  2, '2026-08-29', 'Bangkok',   '#c9992e'),
  ('11111111-1111-1111-1111-111111111111',  3, '2026-08-30', 'Bangkok',   '#c9992e'),
  ('11111111-1111-1111-1111-111111111111',  4, '2026-08-31', 'Phuket',    '#2f97a6'),
  ('11111111-1111-1111-1111-111111111111',  5, '2026-09-01', 'Phuket',    '#2f97a6'),
  ('11111111-1111-1111-1111-111111111111',  6, '2026-09-02', 'Phuket',    '#2f97a6'),
  ('11111111-1111-1111-1111-111111111111',  7, '2026-09-03', 'Saigon',    '#b0472f'),
  ('11111111-1111-1111-1111-111111111111',  8, '2026-09-04', 'Saigon',    '#b0472f'),
  ('11111111-1111-1111-1111-111111111111',  9, '2026-09-05', 'Saigon',    '#b0472f'),
  ('11111111-1111-1111-1111-111111111111', 10, '2026-09-06', 'Saigon',    '#b0472f'),
  ('11111111-1111-1111-1111-111111111111', 11, '2026-09-07', 'Nha Trang', '#3f9b8a'),
  ('11111111-1111-1111-1111-111111111111', 12, '2026-09-08', 'Nha Trang', '#3f9b8a'),
  ('11111111-1111-1111-1111-111111111111', 13, '2026-09-09', 'Nha Trang', '#3f9b8a')
on conflict (trip_id, day_number) do nothing;

-- 3. TRIP_CURRENCIES — replaces trip_settings (two fixed FX columns) + the
--    hard-coded CURRENCY_SYMBOL map. One row per currency; rate_per_base is
--    "local units per 1 unit of the trip's base_currency" (base row = 1). ------
create table if not exists trip_currencies (
  trip_id uuid references trips(id) on delete cascade not null,
  code varchar(3) not null,
  symbol text not null,
  rate_per_base numeric(16, 4) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (trip_id, code)
);

-- Base currency row (GBP @ 1) plus VND/THB seeded from the live trip_settings.
insert into trip_currencies (trip_id, code, symbol, rate_per_base)
values ('11111111-1111-1111-1111-111111111111', 'GBP', '£', 1)
on conflict (trip_id, code) do nothing;

insert into trip_currencies (trip_id, code, symbol, rate_per_base)
select '11111111-1111-1111-1111-111111111111', 'VND', '₫', coalesce(vnd_per_gbp, 35200)
from trip_settings where id = 1
on conflict (trip_id, code) do nothing;

insert into trip_currencies (trip_id, code, symbol, rate_per_base)
select '11111111-1111-1111-1111-111111111111', 'THB', '฿', coalesce(thb_per_gbp, 44.60)
from trip_settings where id = 1
on conflict (trip_id, code) do nothing;

-- Fallback seed if trip_settings row was missing entirely.
insert into trip_currencies (trip_id, code, symbol, rate_per_base) values
  ('11111111-1111-1111-1111-111111111111', 'VND', '₫', 35200),
  ('11111111-1111-1111-1111-111111111111', 'THB', '฿', 44.60)
on conflict (trip_id, code) do nothing;

-- 4. PROFILES → trip-scoped members. --------------------------------------------
-- profiles stays the table the content FKs point at; it just gains trip scope,
-- an (optional) link to a future auth account, and a role. The global-unique
-- name gives way to a per-trip unique name (two trips may each have a "Dave").
alter table profiles add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table profiles add column if not exists user_id uuid; -- FK to users(id) in Phase 2
alter table profiles add column if not exists role text not null default 'member';

alter table profiles drop constraint if exists profiles_name_key;
create unique index if not exists profiles_trip_name_idx on profiles (trip_id, lower(name));
create unique index if not exists profiles_trip_user_idx on profiles (trip_id, user_id)
  where user_id is not null;
create index if not exists profiles_trip_idx on profiles (trip_id);

-- 5. trip_id on every content table (defaulted → existing rows + old code safe).
alter table itinerary_items add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table photos add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table expenses add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table expense_splits add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table receipts add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table receipt_items add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;
alter table stat_entries add column if not exists trip_id uuid references trips(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111' not null;

create index if not exists itinerary_items_trip_idx on itinerary_items (trip_id, day_number);
create index if not exists photos_trip_idx on photos (trip_id);
create index if not exists expenses_trip_idx on expenses (trip_id, day_number);
create index if not exists expense_splits_trip_idx on expense_splits (trip_id);
create index if not exists receipts_trip_idx on receipts (trip_id);
create index if not exists receipt_items_trip_idx on receipt_items (trip_id);
create index if not exists stat_entries_trip_idx on stat_entries (trip_id);

-- 6. Notification tables: their trip_id is text and previously held the string
--    'thailand-vietnam-2026'. Re-point it at the trip uuid (still stored as
--    text) so there is one canonical trip id everywhere. Phase 2 tightens the
--    column type to uuid alongside the auth work.
update activity_events
  set trip_id = '11111111-1111-1111-1111-111111111111'
  where trip_id = 'thailand-vietnam-2026';
alter table activity_events alter column trip_id
  set default '11111111-1111-1111-1111-111111111111';

-- notification_state has a (profile_id, trip_id) PK, and the live app may have
-- ALREADY written rows under the uuid trip_id (Phase 1 code uses it). A blind
-- relabel of the legacy 'thailand-vietnam-2026' row would then collide with an
-- existing uuid row. So: fold the legacy watermarks into the uuid row (keeping
-- the latest of each timestamp), drop the now-duplicate legacy rows, then
-- relabel whatever legacy rows remain.
update notification_state n
   set last_seen_at = greatest(n.last_seen_at, l.last_seen_at),
       last_notified_at = greatest(n.last_notified_at, l.last_notified_at)
  from notification_state l
 where l.profile_id = n.profile_id
   and n.trip_id = '11111111-1111-1111-1111-111111111111'
   and l.trip_id = 'thailand-vietnam-2026';

delete from notification_state
 where trip_id = 'thailand-vietnam-2026'
   and profile_id in (
     select profile_id from notification_state
      where trip_id = '11111111-1111-1111-1111-111111111111'
   );

update notification_state
  set trip_id = '11111111-1111-1111-1111-111111111111'
  where trip_id = 'thailand-vietnam-2026';
alter table notification_state alter column trip_id
  set default '11111111-1111-1111-1111-111111111111';

-- 7. RLS — new tables are readable/writable (still no auth; Phase 2 locks down).
alter table trips enable row level security;
alter table trip_days enable row level security;
alter table trip_currencies enable row level security;
create policy "Allow public access" on trips for all using (true) with check (true);
create policy "Allow public access" on trip_days for all using (true) with check (true);
create policy "Allow public access" on trip_currencies for all using (true) with check (true);

-- 8. Realtime for the new tables.
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table trip_days;
alter publication supabase_realtime add table trip_currencies;
