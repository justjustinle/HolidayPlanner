-- Edit the details collected by the trip wizard while preserving existing
-- activities, expenses, invite links, memberships, and configured FX rates.
create or replace function public.update_trip_v2(
  p_trip uuid,
  p_name text,
  p_home_currency text,
  p_destinations jsonb,
  p_destination_currencies jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home text := upper(trim(coalesce(p_home_currency, '')));
  v_old_home text;
  v_leg jsonb;
  v_city text;
  v_start date;
  v_end date;
  v_first_start date;
  v_last_end date;
  v_previous_end date;
  v_day date;
  v_day_number integer := 0;
  v_total_days integer := 0;
  v_max_used_day integer := 0;
  v_currency jsonb;
  v_currency_code text;
  v_accent text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.is_trip_member(p_trip) then raise exception 'trip membership required'; end if;
  if trim(coalesce(p_name, '')) = '' then raise exception 'trip name required'; end if;
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

  select base_currency into v_old_home from public.trips where id = p_trip;
  if v_old_home is null then raise exception 'trip not found'; end if;

  for v_leg in
    select value
    from jsonb_array_elements(p_destinations) with ordinality as legs(value, position)
    order by position
  loop
    v_city := trim(coalesce(v_leg->>'destination', ''));
    if v_city = '' then raise exception 'name each destination'; end if;
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
    v_accent := coalesce(nullif(v_leg->>'accent_hex', ''), '#2f97a6');
    if v_accent !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'invalid destination colour';
    end if;
    v_first_start := coalesce(v_first_start, v_start);
    v_last_end := v_end;
    v_previous_end := v_end;
    v_total_days := v_total_days + (v_end - v_start) + 1;
  end loop;

  select greatest(
    coalesce((select max(day_number) from public.itinerary_items where trip_id = p_trip), 0),
    coalesce((select max(day_number) from public.expenses where trip_id = p_trip), 0)
  ) into v_max_used_day;
  if v_total_days < v_max_used_day then
    raise exception 'this trip has activities or expenses through day %; keep at least % days',
      v_max_used_day, v_max_used_day;
  end if;

  if v_home <> v_old_home
     and exists (select 1 from public.expenses where trip_id = p_trip) then
    raise exception 'home currency cannot change after expenses have been added';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb)) c
    where upper(trim(c.value #>> '{}')) !~ '^[A-Z]{3}$'
  ) then
    raise exception 'destination currencies must use three-letter codes';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb)) c
    where upper(trim(c.value #>> '{}')) = v_home
  ) then
    raise exception 'home currency does not need to be added again';
  end if;
  if (
    select count(*) <> count(distinct upper(trim(value #>> '{}')))
    from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb))
  ) then
    raise exception 'remove duplicate destination currencies';
  end if;
  if exists (
    select 1
    from public.expenses e
    where e.trip_id = p_trip
      and e.local_currency <> v_home
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb)) c
        where upper(trim(c.value #>> '{}')) = e.local_currency
      )
  ) then
    raise exception 'a destination currency used by existing expenses cannot be removed';
  end if;

  update public.trips
  set name = trim(p_name),
      start_date = v_first_start,
      end_date = v_last_end,
      base_currency = v_home
  where id = p_trip;

  delete from public.trip_days where trip_id = p_trip;
  for v_leg in
    select value
    from jsonb_array_elements(p_destinations) with ordinality as legs(value, position)
    order by position
  loop
    v_city := trim(v_leg->>'destination');
    v_start := (v_leg->>'start_date')::date;
    v_end := (v_leg->>'end_date')::date;
    v_accent := coalesce(nullif(v_leg->>'accent_hex', ''), '#2f97a6');
    v_day := v_start;
    while v_day <= v_end loop
      v_day_number := v_day_number + 1;
      insert into public.trip_days (
        trip_id, day_number, date, destination, accent_hex
      )
      values (p_trip, v_day_number, v_day, v_city, v_accent);
      v_day := v_day + 1;
    end loop;
  end loop;

  if v_home <> v_old_home then
    update public.trip_currencies
    set rate_per_base = null
    where trip_id = p_trip;
  end if;

  insert into public.trip_currencies (trip_id, code, symbol, rate_per_base)
  values (
    p_trip,
    v_home,
    case v_home
      when 'GBP' then '£' when 'USD' then '$' when 'EUR' then '€'
      when 'THB' then '฿' when 'VND' then '₫' when 'JPY' then '¥'
      when 'AUD' then '$' when 'SGD' then '$' else v_home
    end,
    1
  )
  on conflict (trip_id, code) do update
    set symbol = excluded.symbol, rate_per_base = 1, updated_at = now();

  for v_currency in
    select value
    from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb))
  loop
    v_currency_code := upper(trim(v_currency #>> '{}'));
    insert into public.trip_currencies (trip_id, code, symbol, rate_per_base)
    values (
      p_trip,
      v_currency_code,
      case v_currency_code
        when 'GBP' then '£' when 'USD' then '$' when 'EUR' then '€'
        when 'THB' then '฿' when 'VND' then '₫' when 'JPY' then '¥'
        when 'AUD' then '$' when 'SGD' then '$' else v_currency_code
      end,
      null
    )
    on conflict (trip_id, code) do update
      set symbol = excluded.symbol, updated_at = now();
  end loop;

  delete from public.trip_currencies tc
  where tc.trip_id = p_trip
    and tc.code <> v_home
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_destination_currencies, '[]'::jsonb)) c
      where upper(trim(c.value #>> '{}')) = tc.code
    );
end;
$$;

revoke all on function public.update_trip_v2(uuid, text, text, jsonb, jsonb) from public;
grant execute on function public.update_trip_v2(uuid, text, text, jsonb, jsonb) to authenticated;
