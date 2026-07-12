-- =============================================================================
-- Migration v3 — run ONCE in the Supabase SQL Editor on an existing project.
-- (Fresh projects can just run schema.sql instead, which includes all of this.)
--
-- Adds: batched activity push notifications — an activity event log, web push
-- subscriptions (multiple devices per person), and per-recipient notification
-- watermarks (which also give per-trip preferences a home later).
-- =============================================================================

-- 1. ACTIVITY EVENTS — one row per thing that happened (expense added, photo
--    added, ...). recipient_id NULL = broadcast (batched digest); set =
--    targeted at one person (immediate tier, e.g. added to an expense split).
create table if not exists activity_events (
  id uuid default uuid_generate_v4() primary key,
  trip_id text not null default 'thailand-vietnam-2026',
  event_type text not null,
  actor_id uuid references profiles(id) on delete set null,
  recipient_id uuid references profiles(id) on delete cascade,
  payload jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists activity_events_trip_created_idx
  on activity_events (trip_id, created_at);

-- 2. PUSH SUBSCRIPTIONS — one row per browser/device a person enabled push
--    on. Rows are deleted when the push service returns 404/410 (expired).
create table if not exists push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists push_subscriptions_profile_idx
  on push_subscriptions (profile_id);

-- 3. NOTIFICATION STATE — per person, per trip. Watermarks instead of
--    per-event read receipts: events newer than greatest(last_seen_at,
--    last_notified_at) are "unnotified". Per-trip preference columns (muted,
--    important-only) can be added here later without restructuring.
create table if not exists notification_state (
  profile_id uuid references profiles(id) on delete cascade not null,
  trip_id text not null default 'thailand-vietnam-2026',
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_notified_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (profile_id, trip_id)
);

-- RLS + open policies (same trust model as the rest of the app).
alter table activity_events enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_state enable row level security;

create policy "Allow public access" on activity_events for all using (true) with check (true);
create policy "Allow public access" on push_subscriptions for all using (true) with check (true);
create policy "Allow public access" on notification_state for all using (true) with check (true);
