-- =============================================================================
-- Migration v2 — run ONCE in the Supabase SQL Editor on an existing project.
-- (Fresh projects can just run schema.sql instead, which includes all of this.)
--
-- Adds: photo carousels, standalone expenses, scanned receipts with
-- self-claimable line items, and daily stat counters.
-- =============================================================================

-- 1. PHOTOS — multiple per activity, with people-tagging for the photo counter.
create table if not exists photos (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references itinerary_items(id) on delete cascade not null,
  url text not null,
  uploaded_by_id uuid references profiles(id) on delete set null,
  tagged_user_ids uuid[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists photos_activity_idx on photos (activity_id);

-- Carry v1 single-photo cards into the new carousel.
insert into photos (activity_id, url)
select id, photo_url from itinerary_items where photo_url is not null;

-- 2. EXPENSES — decoupled from itinerary cards. Now standalone with a label,
--    a trip day, and a kind ('manual' split vs scanned 'receipt').
alter table expenses alter column activity_id drop not null;
alter table expenses add column if not exists label text;
alter table expenses add column if not exists day_number integer;
alter table expenses add column if not exists kind text not null default 'manual';

-- Backfill labels/days for old activity-linked expenses.
update expenses e
set label = coalesce(e.label, i.title),
    day_number = coalesce(e.day_number, i.day_number)
from itinerary_items i
where e.activity_id = i.id;

-- 3. RECEIPTS — one per 'receipt' expense, scanned by Gemini.
create table if not exists receipts (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  merchant text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists receipts_expense_idx on receipts (expense_id);

-- 4. RECEIPT LINE ITEMS — claimed_by_id stays null ("untagged") until a user
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
create index if not exists receipt_items_receipt_idx on receipt_items (receipt_id);

-- 5. DAILY STATS — one row per person / day / category.
create table if not exists stat_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  day_number integer not null,
  category text not null check (category in ('poop', 'drink', 'mosquito', 'coffee', 'steps')),
  count integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, day_number, category)
);

-- RLS + open policies (same trust model as the rest of the app).
alter table photos enable row level security;
alter table receipts enable row level security;
alter table receipt_items enable row level security;
alter table stat_entries enable row level security;

create policy "Allow public access" on photos for all using (true) with check (true);
create policy "Allow public access" on receipts for all using (true) with check (true);
create policy "Allow public access" on receipt_items for all using (true) with check (true);
create policy "Allow public access" on stat_entries for all using (true) with check (true);

-- Realtime for live claiming, photo sync, and leaderboards.
alter publication supabase_realtime add table photos;
alter publication supabase_realtime add table receipts;
alter publication supabase_realtime add table receipt_items;
alter publication supabase_realtime add table stat_entries;

-- Storage: allow deleting photos from the memories bucket (carousel delete).
create policy "Public delete memories"
  on storage.objects for delete using (bucket_id = 'memories');
