-- =============================================================================
-- Collaborative Travel PWA — Supabase schema
-- Run this in your Supabase project's SQL Editor.
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
-- If the table already exists from an earlier version, add the column:
alter table profiles add column if not exists avatar_url text;

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
  time_label text not null,    -- e.g., "8:00 AM", "Evening"
  title text not null,         -- e.g., "Train Street Coffee"
  location text,               -- Address or Google Maps link
  photo_url text,              -- Public URL to the storage bucket file (Nullable)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. EXPENSES TABLE
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references itinerary_items(id) on delete cascade not null,
  local_amount numeric(12, 2) not null,
  local_currency varchar(3) not null, -- 'VND', 'THB', 'GBP'
  base_amount_gbp numeric(12, 2) not null, -- Computed via active exchange rate
  paid_by_id uuid references profiles(id) on delete set null not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. EXPENSE SPLITS TABLE
create table if not exists expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  amount_owed numeric(12, 2) not null
);

-- 6. PACKING / CHECKLIST TABLE (Tab 3)
create table if not exists checklist_items (
  id uuid default uuid_generate_v4() primary key,
  label text not null,
  scope text not null default 'group', -- 'group' or 'individual'
  owner_id uuid references profiles(id) on delete cascade, -- null for group items
  checked boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helpful indexes
create index if not exists itinerary_items_day_idx on itinerary_items (day_number);
create index if not exists expenses_activity_idx on expenses (activity_id);
create index if not exists expense_splits_expense_idx on expense_splits (expense_id);
create index if not exists checklist_scope_idx on checklist_items (scope);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table itinerary_items enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table trip_settings enable row level security;
alter table checklist_items enable row level security;

-- Public read/write policies for easy group access (no auth in this build).
-- Tighten these if you later add Supabase Auth.
create policy "Allow public access" on profiles for all using (true) with check (true);
create policy "Allow public access" on itinerary_items for all using (true) with check (true);
create policy "Allow public access" on expenses for all using (true) with check (true);
create policy "Allow public access" on expense_splits for all using (true) with check (true);
create policy "Allow public access" on trip_settings for all using (true) with check (true);
create policy "Allow public access" on checklist_items for all using (true) with check (true);

-- Realtime: broadcast row changes to subscribed clients.
alter publication supabase_realtime add table itinerary_items;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table expense_splits;
alter publication supabase_realtime add table trip_settings;
alter publication supabase_realtime add table checklist_items;

-- =============================================================================
-- STORAGE: public "memories" bucket for one-photo-per-card uploads.
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
