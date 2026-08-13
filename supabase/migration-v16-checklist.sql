-- migration-v16: trip-scoped checklist (pre-trip / whole-trip items).
-- Not day- or activity-linked — vaccines, passports, adapters, etc.
--
-- Replaces any earlier unused checklist_items prototype (scope/owner/checked).

drop table if exists checklist_items cascade;

create table checklist_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  label text not null,
  is_done boolean not null default false,
  created_by_id uuid references profiles(id) on delete set null,
  completed_by_id uuid references profiles(id) on delete set null,
  completed_at timestamp with time zone,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists checklist_items_trip_idx
  on checklist_items (trip_id, sort_order, created_at);

alter table checklist_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_items'
      and policyname = 'Allow public access'
  ) then
    create policy "Allow public access" on checklist_items
      for all using (true) with check (true);
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'is_trip_member'
      and pg_function_is_visible(oid)
  ) and not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_items'
      and policyname = 'trip members'
  ) then
    create policy "trip members" on checklist_items
      for all
      using (public.is_trip_member(trip_id))
      with check (public.is_trip_member(trip_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'checklist_items'
  ) then
    alter publication supabase_realtime add table checklist_items;
  end if;
end $$;
