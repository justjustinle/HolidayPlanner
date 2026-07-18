-- Preserve a traveler's profile and historical attribution while allowing
-- their account membership to be deactivated and later restored.
alter table public.profiles
  add column if not exists left_at timestamp with time zone;

create or replace function public.is_trip_member(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where trip_id = t
      and user_id = auth.uid()
      and left_at is null
  );
$$;

create or replace function public.is_trip_owner(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where trip_id = t
      and user_id = auth.uid()
      and role = 'owner'
      and left_at is null
  );
$$;

-- Rejoining reactivates the same profile so expenses, photos, and stats remain
-- attached to one traveler identity.
create or replace function public.join_trip(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid;
  v_existing uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select trip_id into v_trip
  from public.trip_invites
  where code = invite_code
    and revoked = false
    and (expires_at is null or expires_at > now())
  limit 1;
  if v_trip is null then raise exception 'invalid or expired invite'; end if;

  select id into v_existing
  from public.profiles
  where trip_id = v_trip and user_id = auth.uid()
  limit 1;

  if v_existing is not null then
    update public.profiles set left_at = null where id = v_existing;
    return v_trip;
  end if;

  insert into public.profiles (trip_id, name, user_id, role)
  values (
    v_trip,
    coalesce((select display_name from public.users where id = auth.uid()), 'Traveler'),
    auth.uid(),
    'member'
  );
  return v_trip;
end;
$$;

create or replace function public.leave_trip(p_trip uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  update public.profiles
  set left_at = timezone('utc'::text, now())
  where trip_id = p_trip
    and user_id = auth.uid()
    and left_at is null;

  if not found then raise exception 'active trip membership not found'; end if;
end;
$$;

revoke all on function public.leave_trip(uuid) from public;
grant execute on function public.leave_trip(uuid) to authenticated;
