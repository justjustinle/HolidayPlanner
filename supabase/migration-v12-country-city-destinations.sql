-- Store the mandatory country and optional city separately while keeping the
-- existing `destination` column as the display label consumed by older clients.
alter table public.trip_days add column if not exists country text;
alter table public.trip_days add column if not exists city text;

update public.trip_days
set country = case
      when destination in ('Bangkok', 'Phuket') then 'Thailand'
      when destination in ('Saigon', 'Nha Trang') then 'Vietnam'
      else destination
    end,
    city = case
      when destination in ('Bangkok', 'Phuket', 'Saigon', 'Nha Trang')
        then destination
      else null
    end
where country is null;

create or replace function public.normalize_trip_day_destination()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.country := coalesce(nullif(trim(new.country), ''), nullif(trim(new.destination), ''));
  if new.country is null then raise exception 'country is required'; end if;
  new.city := nullif(trim(new.city), '');
  new.destination := coalesce(new.city, new.country);
  return new;
end;
$$;

drop trigger if exists normalize_trip_day_destination on public.trip_days;
create trigger normalize_trip_day_destination
before insert or update of destination, country, city on public.trip_days
for each row execute function public.normalize_trip_day_destination();

alter table public.trip_days alter column country set not null;

-- Compatibility wrapper around v2: validate/transform the new destination
-- shape, let v2 perform its atomic creation, then persist country and city.
create or replace function public.create_trip_v3(
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
  v_result jsonb;
  v_trip uuid;
  v_legacy_destinations jsonb;
begin
  if jsonb_typeof(p_destinations) <> 'array'
     or jsonb_array_length(p_destinations) = 0 then
    raise exception 'at least one destination is required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_destinations) leg
    where trim(coalesce(leg.value->>'country', '')) = ''
  ) then
    raise exception 'country is required for every destination';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'destination', coalesce(
        nullif(trim(leg.value->>'city'), ''),
        trim(leg.value->>'country')
      ),
      'start_date', leg.value->>'start_date',
      'end_date', leg.value->>'end_date',
      'accent_hex', leg.value->>'accent_hex'
    )
    order by leg.position
  )
  into v_legacy_destinations
  from jsonb_array_elements(p_destinations)
    with ordinality as leg(value, position);

  v_result := public.create_trip_v2(
    p_name,
    p_owner_name,
    p_home_currency,
    v_legacy_destinations,
    p_destination_currencies
  );
  v_trip := (v_result->>'trip_id')::uuid;

  update public.trip_days d
  set country = trim(leg.value->>'country'),
      city = nullif(trim(leg.value->>'city'), '')
  from jsonb_array_elements(p_destinations) leg
  where d.trip_id = v_trip
    and d.date between (leg.value->>'start_date')::date
                   and (leg.value->>'end_date')::date;

  return v_result;
end;
$$;

revoke all on function public.create_trip_v3(text, text, text, jsonb, jsonb) from public;
grant execute on function public.create_trip_v3(text, text, text, jsonb, jsonb) to authenticated;

-- Editing uses the same compatibility approach so all v2 safeguards around
-- existing activities, expenses, home currency, and FX rates remain active.
create or replace function public.update_trip_v3(
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
  v_legacy_destinations jsonb;
begin
  if jsonb_typeof(p_destinations) <> 'array'
     or jsonb_array_length(p_destinations) = 0 then
    raise exception 'at least one destination is required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_destinations) leg
    where trim(coalesce(leg.value->>'country', '')) = ''
  ) then
    raise exception 'country is required for every destination';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'destination', coalesce(
        nullif(trim(leg.value->>'city'), ''),
        trim(leg.value->>'country')
      ),
      'start_date', leg.value->>'start_date',
      'end_date', leg.value->>'end_date',
      'accent_hex', leg.value->>'accent_hex'
    )
    order by leg.position
  )
  into v_legacy_destinations
  from jsonb_array_elements(p_destinations)
    with ordinality as leg(value, position);

  perform public.update_trip_v2(
    p_trip,
    p_name,
    p_home_currency,
    v_legacy_destinations,
    p_destination_currencies
  );

  update public.trip_days d
  set country = trim(leg.value->>'country'),
      city = nullif(trim(leg.value->>'city'), '')
  from jsonb_array_elements(p_destinations) leg
  where d.trip_id = p_trip
    and d.date between (leg.value->>'start_date')::date
                   and (leg.value->>'end_date')::date;
end;
$$;

revoke all on function public.update_trip_v3(uuid, text, text, jsonb, jsonb) from public;
grant execute on function public.update_trip_v3(uuid, text, text, jsonb, jsonb) to authenticated;
