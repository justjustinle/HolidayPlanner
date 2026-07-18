-- =============================================================================
-- Migration v8 — destination date ranges and first-class trip invitations.
--
-- The existing create_trip RPC remains available for older clients. The new
-- create_trip_v2 RPC validates destination ranges, expands them into trip_days,
-- stores currencies without requiring rates, and creates an invite atomically.
-- =============================================================================

-- A destination currency can be selected before its exchange rate is known.
alter table public.trip_currencies
  alter column rate_per_base drop not null;

create or replace function public.create_trip_v2(
  p_name text,
  p_owner_name text,
  p_home_currency text,
  p_destinations jsonb,
  p_destination_currencies jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid;
  v_code text;
  v_home text := upper(trim(coalesce(p_home_currency, '')));
  v_leg jsonb;
  v_city text;
  v_start date;
  v_end date;
  v_first_start date;
  v_last_end date;
  v_previous_end date;
  v_day date;
  v_day_number integer := 0;
  v_currency jsonb;
  v_currency_code text;
  v_accent text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'trip name required';
  end if;
  if v_home !~ '^[A-Z]{3}$' then
    raise exception 'home currency must be a three-letter code';
  end if;
  if jsonb_typeof(p_destinations) <> 'array'
     or jsonb_array_length(p_destinations) = 0 then
    raise exception 'at least one destination is required';
  end if;
  if jsonb_array_length(p_destinations) > 20 then
    raise exception 'a trip can have at most 20 destinations';
  end if;
  if p_destination_currencies is not null
     and jsonb_typeof(p_destination_currencies) <> 'array' then
    raise exception 'destination currencies must be an array';
  end if;

  -- Validate that the entered ranges form one continuous, non-overlapping trip.
  for v_leg in
    select value
    from jsonb_array_elements(p_destinations) with ordinality as legs(value, position)
    order by position
  loop
    v_city := trim(coalesce(v_leg->>'destination', ''));
    if v_city = '' then
      raise exception 'name each destination';
    end if;
    if coalesce(v_leg->>'start_date', '') = ''
       or coalesce(v_leg->>'end_date', '') = '' then
      raise exception 'add start and end dates for every destination';
    end if;

    v_start := (v_leg->>'start_date')::date;
    v_end := (v_leg->>'end_date')::date;
    if v_end < v_start then
      raise exception 'the end date for % is before its start date', v_city;
    end if;
    if v_previous_end is not null and v_start <> v_previous_end + 1 then
      raise exception 'destination dates must be consecutive without gaps or overlaps';
    end if;

    v_first_start := coalesce(v_first_start, v_start);
    v_last_end := v_end;
    v_previous_end := v_end;
  end loop;

  insert into public.trips (name, start_date, end_date, base_currency, created_by)
  values (trim(p_name), v_first_start, v_last_end, v_home, auth.uid())
  returning id into v_trip;

  insert into public.profiles (trip_id, name, user_id, role)
  values (
    v_trip,
    coalesce(
      nullif(trim(coalesce(p_owner_name, '')), ''),
      (select display_name from public.users where id = auth.uid()),
      'Me'
    ),
    auth.uid(),
    'owner'
  );

  for v_leg in
    select value
    from jsonb_array_elements(p_destinations) with ordinality as legs(value, position)
    order by position
  loop
    v_city := trim(v_leg->>'destination');
    v_start := (v_leg->>'start_date')::date;
    v_end := (v_leg->>'end_date')::date;
    v_accent := coalesce(nullif(v_leg->>'accent_hex', ''), '#2f97a6');
    if v_accent !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'invalid destination colour';
    end if;

    v_day := v_start;
    while v_day <= v_end loop
      v_day_number := v_day_number + 1;
      insert into public.trip_days (
        trip_id, day_number, date, destination, accent_hex
      )
      values (v_trip, v_day_number, v_day, v_city, v_accent);
      v_day := v_day + 1;
    end loop;
  end loop;

  insert into public.trip_currencies (trip_id, code, symbol, rate_per_base)
  values (
    v_trip,
    v_home,
    case v_home
      when 'GBP' then '£' when 'USD' then '$' when 'EUR' then '€'
      when 'THB' then '฿' when 'VND' then '₫' when 'JPY' then '¥'
      when 'AUD' then '$' when 'SGD' then '$' else v_home
    end,
    1
  );

  for v_currency in
    select value
    from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb))
  loop
    v_currency_code := upper(trim(v_currency #>> '{}'));
    if v_currency_code !~ '^[A-Z]{3}$' then
      raise exception 'destination currencies must use three-letter codes';
    end if;
    if v_currency_code <> v_home then
      insert into public.trip_currencies (trip_id, code, symbol, rate_per_base)
      values (
        v_trip,
        v_currency_code,
        case v_currency_code
          when 'GBP' then '£' when 'USD' then '$' when 'EUR' then '€'
          when 'THB' then '฿' when 'VND' then '₫' when 'JPY' then '¥'
          when 'AUD' then '$' when 'SGD' then '$' else v_currency_code
        end,
        null
      )
      on conflict (trip_id, code) do nothing;
    end if;
  end loop;

  -- UUID-derived codes are URL-safe and have enough entropy to be unguessable.
  loop
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    begin
      insert into public.trip_invites (trip_id, code, created_by)
      values (v_trip, v_code, auth.uid());
      exit;
    exception when unique_violation then
      -- Extremely unlikely, but retry instead of failing the whole creation.
    end;
  end loop;

  return jsonb_build_object('trip_id', v_trip, 'invite_code', v_code);
end;
$$;

revoke all on function public.create_trip_v2(text, text, text, jsonb, jsonb) from public;
grant execute on function public.create_trip_v2(text, text, text, jsonb, jsonb) to authenticated;

-- Minimal public preview for an unlisted invite URL. It deliberately exposes
-- no itinerary, roster identities, expenses, or creator information.
create or replace function public.resolve_trip_invite(invite_code text)
returns table (
  trip_id uuid,
  trip_name text,
  start_date date,
  end_date date,
  member_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    t.id,
    t.name,
    t.start_date,
    t.end_date,
    (select count(*) from public.profiles p where p.trip_id = t.id)
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  where i.code = invite_code
    and i.revoked = false
    and (i.expires_at is null or i.expires_at > now())
  limit 1;
$$;

revoke all on function public.resolve_trip_invite(text) from public;
grant execute on function public.resolve_trip_invite(text) to anon, authenticated;
