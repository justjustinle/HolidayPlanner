-- =============================================================================
-- Migration v6 (Phase 2 of multi-tenant) — AUTH + ROW LEVEL SECURITY LOCKDOWN.
--
-- ⚠️ Apply this ONLY together with turning auth on, i.e. in the same change:
--    1. Enable the Google provider in Supabase Auth + configure the Google
--       Cloud OAuth client (see docs/MULTI_TENANT.md).
--    2. Set Vercel env NEXT_PUBLIC_AUTH_ENABLED=true and SUPABASE_SERVICE_ROLE_KEY.
--    3. Apply this migration.
--
-- Applying it WITHOUT a signed-in session will make every anon request fail the
-- new membership policies (that is the point) — so the app must be sending
-- Google-authenticated requests before this lands, or the live site locks out.
-- Phase 1 (migration v5) must already be applied.
-- =============================================================================

-- 1. USERS — a public mirror of auth.users so the app never queries the auth
--    schema directly. Kept in sync by a trigger on sign-up. -------------------
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.users.display_name, excluded.display_name),
        avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any pre-existing auth users (no-op on a fresh auth setup).
insert into public.users (id, email, display_name, avatar_url)
select id, email,
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
       raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 2. Wire the account links added (nullable) in Phase 1 to real FKs. ----------
alter table profiles
  add constraint profiles_user_id_fkey foreign key (user_id) references users(id) on delete set null;
alter table trips
  add constraint trips_created_by_fkey foreign key (created_by) references users(id) on delete set null;

-- 3. TRIP_INVITES — join-by-link. One active code per trip is plenty; revoke +
--    reissue to rotate. -------------------------------------------------------
create table if not exists trip_invites (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  code text unique not null,
  created_by uuid references users(id) on delete set null,
  expires_at timestamp with time zone,
  revoked boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists trip_invites_trip_idx on trip_invites (trip_id);

-- 4. Membership helper. SECURITY DEFINER so it bypasses RLS on `profiles`
--    (avoids recursive policy evaluation when profiles' own policy calls it). -
create or replace function public.is_trip_member(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where trip_id = t and user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where trip_id = t and user_id = auth.uid() and role = 'owner'
  );
$$;

-- 5. RPCs for the join / claim / create flows (SECURITY DEFINER: they perform
--    the one privileged insert/update the membership policies forbid). --------

-- Join a trip via an invite code. Idempotent: returns the trip id whether the
-- caller was already a member or is newly added.
create or replace function public.join_trip(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_trip uuid;
  v_existing uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select trip_id into v_trip from trip_invites
   where code = invite_code and revoked = false
     and (expires_at is null or expires_at > now())
   limit 1;
  if v_trip is null then raise exception 'invalid or expired invite'; end if;

  select id into v_existing from profiles where trip_id = v_trip and user_id = auth.uid();
  if v_existing is not null then return v_trip; end if;

  insert into profiles (trip_id, name, user_id, role)
  values (
    v_trip,
    coalesce((select display_name from users where id = auth.uid()), 'Traveler'),
    auth.uid(),
    'member'
  );
  return v_trip;
end;
$$;

-- Link an unclaimed placeholder member (user_id null) to the caller's account,
-- so that person's existing expense/photo history follows them.
create or replace function public.claim_member(p_member uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select trip_id into v_trip from profiles where id = p_member and user_id is null;
  if v_trip is null then raise exception 'member not claimable'; end if;
  if exists (select 1 from profiles where trip_id = v_trip and user_id = auth.uid()) then
    raise exception 'already a member of this trip';
  end if;
  update profiles set user_id = auth.uid() where id = p_member;
  return v_trip;
end;
$$;

-- 6. Policies: swap "Allow public access" for membership-scoped access. -------
-- Content tables: any member of the row's trip can read and write it (the app
-- keeps its shared-editing model; tenancy is the boundary, not per-row owners).
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'itinerary_items','photos','expenses','expense_splits',
    'receipts','receipt_items','stat_entries','trip_currencies','trip_days'
  ] loop
    execute format('drop policy if exists "Allow public access" on %I', tbl);
    execute format(
      'create policy "trip members" on %I for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id))',
      tbl
    );
  end loop;
end $$;

-- profiles: members see their trip's roster; joins/claims happen via the RPCs
-- above; a user may edit their own membership row (name / avatar).
drop policy if exists "Allow public access" on profiles;
create policy "read trip roster" on profiles for select using (public.is_trip_member(trip_id));
create policy "edit own membership" on profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Owners can manage roster (add placeholder members, remove members).
create policy "owner manages roster" on profiles for all
  using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

-- trips: members read; any authenticated user can create (as themselves);
-- owners update/delete.
drop policy if exists "Allow public access" on trips;
create policy "members read trip" on trips for select
  using (public.is_trip_member(id) or created_by = auth.uid());
create policy "create own trip" on trips for insert
  with check (created_by = auth.uid());
create policy "owner updates trip" on trips for update using (public.is_trip_owner(id));
create policy "owner deletes trip" on trips for delete using (public.is_trip_owner(id));

-- trip_invites: members read (to show/share the code); owners create/revoke.
alter table trip_invites enable row level security;
create policy "members read invites" on trip_invites for select using (public.is_trip_member(trip_id));
create policy "owner manages invites" on trip_invites for all
  using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

-- users: any authenticated user can read (names/avatars shown across rosters);
-- a user may update their own mirror row.
alter table users enable row level security;
create policy "authenticated read users" on users for select using (auth.uid() is not null);
create policy "update own user" on users for update
  using (id = auth.uid()) with check (id = auth.uid());

-- activity_events / notification_state: trip_id is text holding the trip uuid;
-- scope by membership (cast). push_subscriptions stays keyed by profile_id.
drop policy if exists "Allow public access" on activity_events;
create policy "trip members events" on activity_events for all
  using (public.is_trip_member(trip_id::uuid)) with check (public.is_trip_member(trip_id::uuid));

drop policy if exists "Allow public access" on notification_state;
create policy "own notification state" on notification_state for all
  using (public.is_trip_member(trip_id::uuid)) with check (public.is_trip_member(trip_id::uuid));

drop policy if exists "Allow public access" on push_subscriptions;
create policy "own push subs" on push_subscriptions for all
  using (exists (select 1 from profiles p where p.id = push_subscriptions.profile_id and p.user_id = auth.uid()))
  with check (exists (select 1 from profiles p where p.id = push_subscriptions.profile_id and p.user_id = auth.uid()));

-- NOTE ON SERVER ROUTES: /api/notifications/{dispatch,cron} and
-- /api/scan-receipt operate across all users and must therefore use the
-- SERVICE ROLE key (which bypasses RLS), not the anon key. See
-- lib/supabaseAdmin.ts. Set SUPABASE_SERVICE_ROLE_KEY in Vercel + GitHub
-- Actions before enabling auth.

-- Storage (bucket "memories") is left public-read in this phase; tightening it
-- to signed URLs is tracked as a follow-up (touches photos.url, the service
-- worker cache, and every <img>).
