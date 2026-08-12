-- =============================================================================
-- Collaborative Travel PWA — Supabase schema (v2, fresh install)
-- Run this in a NEW Supabase project's SQL Editor.
-- Existing projects from v1: run migration-v2.sql instead.
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS PROFILE TABLE (Unique by Name)
create table if not exists profiles (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  avatar_url text, -- public URL to the profile photo in storage (nullable)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TRIP CONFIGURATION (Exchange Rates Controlled by Group)
create table if not exists trip_settings (
  id integer primary key default 1,
  vnd_per_gbp numeric(12, 2) default 35200.00 not null,
  thb_per_gbp numeric(12, 2) default 44.60 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

-- Seed default settings
insert into trip_settings (id, vnd_per_gbp, thb_per_gbp)
values (1, 35200.00, 44.60)
on conflict (id) do nothing;

-- 3. ITINERARY CARDS TABLE
create table if not exists itinerary_items (
  id uuid default uuid_generate_v4() primary key,
  day_number integer not null,
  time_label text not null,    -- start, e.g. "17:30" (24h); legacy "8:00 AM" still parsed
  end_time_label text,         -- optional end, same format; null = open-ended
  title text not null,         -- e.g., "Train Street Coffee"
  location text,               -- Address or Google Maps link
  notes text,                  -- misc notes (booking ref, meet point, bring X)
  photo_url text,              -- legacy single-photo column (superseded by photos)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PHOTOS — multiple per activity (Polaroid carousel), with people-tagging.
create table if not exists photos (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references itinerary_items(id) on delete cascade not null,
  url text not null,
  uploaded_by_id uuid references profiles(id) on delete set null,
  tagged_user_ids uuid[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. EXPENSES TABLE — standalone (not tied to itinerary cards).
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references itinerary_items(id) on delete cascade, -- legacy link (nullable)
  label text,                          -- e.g. "Street food dinner" / merchant name
  day_number integer,                  -- trip day the expense belongs to
  kind text not null default 'manual', -- 'manual' (equal split) or 'receipt' (claim items)
  local_amount numeric(12, 2) not null,
  local_currency varchar(3) not null,  -- 'VND', 'THB', 'GBP'
  base_amount_gbp numeric(12, 2) not null, -- Computed via active exchange rate
  paid_by_id uuid references profiles(id) on delete set null not null,
  image_url text,                      -- optional proof-of-payment photo (manual expenses)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. EXPENSE SPLITS TABLE (manual expenses only)
create table if not exists expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  amount_owed numeric(12, 2) not null
);

-- 7. RECEIPTS — one per 'receipt' expense, scanned by Gemini.
create table if not exists receipts (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  merchant text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. RECEIPT LINE ITEMS — claimed_by_id stays null ("untagged") until a user
--    self-selects the item; unclaimed lines fall back to the payer in settlement.
create table if not exists receipt_items (
  id uuid default uuid_generate_v4() primary key,
  receipt_id uuid references receipts(id) on delete cascade not null,
  name text not null,
  quantity integer not null default 1,
  local_amount numeric(12, 2) not null,
  claimed_by_id uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TRIP STATS — one row per person / category. Stats are cumulative across
-- the whole trip; day_number is a legacy slot the app always sets to 1.
create table if not exists stat_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  day_number integer not null,
  category text not null check (category in ('poop', 'drink', 'mosquito', 'coffee', 'cards')),
  count integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, day_number, category)
);

-- 10. ACTIVITY EVENTS — one row per thing that happened, feeding batched push
--     notifications. recipient_id NULL = broadcast digest; set = targeted
--     immediate push (e.g. added to an expense split).
create table if not exists activity_events (
  id uuid default uuid_generate_v4() primary key,
  trip_id text not null default 'thailand-vietnam-2026',
  event_type text not null,
  actor_id uuid references profiles(id) on delete set null,
  recipient_id uuid references profiles(id) on delete cascade,
  payload jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. PUSH SUBSCRIPTIONS — one per browser/device; pruned on 404/410.
create table if not exists push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. NOTIFICATION STATE — per person/trip watermarks; events newer than
--     greatest(last_seen_at, last_notified_at) are "unnotified". Future home
--     for per-trip preferences (muted, important-only).
create table if not exists notification_state (
  profile_id uuid references profiles(id) on delete cascade not null,
  trip_id text not null default 'thailand-vietnam-2026',
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_notified_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (profile_id, trip_id)
);

-- Helpful indexes
create index if not exists itinerary_items_day_idx on itinerary_items (day_number);
create index if not exists photos_activity_idx on photos (activity_id);
create index if not exists expenses_day_idx on expenses (day_number);
create index if not exists expense_splits_expense_idx on expense_splits (expense_id);
create index if not exists receipts_expense_idx on receipts (expense_id);
create index if not exists receipt_items_receipt_idx on receipt_items (receipt_id);
create index if not exists stat_entries_user_idx on stat_entries (user_id);
create index if not exists activity_events_trip_created_idx on activity_events (trip_id, created_at);
create index if not exists push_subscriptions_profile_idx on push_subscriptions (profile_id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table itinerary_items enable row level security;
alter table photos enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table receipts enable row level security;
alter table receipt_items enable row level security;
alter table trip_settings enable row level security;
alter table stat_entries enable row level security;
alter table activity_events enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_state enable row level security;

-- Public read/write policies for easy group access (no auth in this build).
-- Tighten these if you later add Supabase Auth.
create policy "Allow public access" on profiles for all using (true) with check (true);
create policy "Allow public access" on itinerary_items for all using (true) with check (true);
create policy "Allow public access" on photos for all using (true) with check (true);
create policy "Allow public access" on expenses for all using (true) with check (true);
create policy "Allow public access" on expense_splits for all using (true) with check (true);
create policy "Allow public access" on receipts for all using (true) with check (true);
create policy "Allow public access" on receipt_items for all using (true) with check (true);
create policy "Allow public access" on trip_settings for all using (true) with check (true);
create policy "Allow public access" on stat_entries for all using (true) with check (true);
create policy "Allow public access" on activity_events for all using (true) with check (true);
create policy "Allow public access" on push_subscriptions for all using (true) with check (true);
create policy "Allow public access" on notification_state for all using (true) with check (true);

-- Realtime: broadcast row changes to subscribed clients.
alter publication supabase_realtime add table itinerary_items;
alter publication supabase_realtime add table photos;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table expense_splits;
alter publication supabase_realtime add table receipts;
alter publication supabase_realtime add table receipt_items;
alter publication supabase_realtime add table trip_settings;
alter publication supabase_realtime add table stat_entries;

-- =============================================================================
-- STORAGE: public "memories" bucket — carousel photos, avatars, receipt scans.
-- (You can also create this in the Storage UI instead.)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

create policy "Public read memories"
  on storage.objects for select using (bucket_id = 'memories');
create policy "Public write memories"
  on storage.objects for insert with check (bucket_id = 'memories');
create policy "Public update memories"
  on storage.objects for update using (bucket_id = 'memories');
create policy "Public delete memories"
  on storage.objects for delete using (bucket_id = 'memories');
