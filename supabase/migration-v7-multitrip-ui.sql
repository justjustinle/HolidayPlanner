-- =============================================================================
-- Migration v7 (Phase 4 of multi-tenant) — RPCs for the multi-trip UI.
--
-- Apply after v6 (auth + RLS). These SECURITY DEFINER functions perform the
-- privileged inserts/reads the membership policies deliberately forbid:
--   • create_trip       — atomically create a trip + its owner membership +
--                         days + currencies (the owner row can't be inserted by
--                         the normal policies before the trip exists).
--   • claimable_members — list a trip's unclaimed member rows for a valid invite
--                         code, so a not-yet-member can pick "which one am I"
--                         under locked-down RLS.
-- (join_trip / claim_member already exist from v6.)
-- =============================================================================

-- Create a trip and everything a fresh trip needs, as one transaction.
--   p_days:       jsonb array of {day_number,date,destination,accent_hex}
--   p_currencies: jsonb array of {code,symbol,rate_per_base}
create or replace function public.create_trip(
  p_name text,
  p_start date,
  p_end date,
  p_base text,
  p_owner_name text,
  p_days jsonb,
  p_currencies jsonb
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  insert into trips (name, start_date, end_date, base_currency, created_by)
  values (p_name, p_start, p_end, coalesce(nullif(p_base, ''), 'GBP'), auth.uid())
  returning id into v_trip;

  insert into profiles (trip_id, name, user_id, role)
  values (
    v_trip,
    coalesce(nullif(p_owner_name, ''), (select display_name from users where id = auth.uid()), 'Me'),
    auth.uid(),
    'owner'
  );

  if p_days is not null then
    insert into trip_days (trip_id, day_number, date, destination, accent_hex)
    select v_trip,
           (d->>'day_number')::int,
           (d->>'date')::date,
           d->>'destination',
           d->>'accent_hex'
    from jsonb_array_elements(p_days) d;
  end if;

  if p_currencies is not null then
    insert into trip_currencies (trip_id, code, symbol, rate_per_base)
    select v_trip, c->>'code', c->>'symbol', (c->>'rate_per_base')::numeric
    from jsonb_array_elements(p_currencies) c;
  end if;

  return v_trip;
end;
$$;

-- Unclaimed members of the trip a valid invite code points at, so a joiner can
-- attach to an existing person (their expense/photo history) instead of adding
-- a duplicate. Empty when the code is invalid/expired.
create or replace function public.claimable_members(invite_code text)
returns table (id uuid, name text, avatar_url text)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.avatar_url
  from profiles p
  join trip_invites i on i.trip_id = p.trip_id
  where i.code = invite_code
    and i.revoked = false
    and (i.expires_at is null or i.expires_at > now())
    and p.user_id is null;
$$;
