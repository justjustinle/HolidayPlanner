-- Expose unique destination countries on the public invite preview so the
-- /join/[code] landing can render flags without revealing itinerary detail.

drop function if exists public.resolve_trip_invite(text);

create or replace function public.resolve_trip_invite(invite_code text)
returns table (
  trip_id uuid,
  trip_name text,
  start_date date,
  end_date date,
  member_count bigint,
  countries text[]
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
    (select count(*) from public.profiles p where p.trip_id = t.id and p.left_at is null),
    coalesce(
      (
        select array_agg(ordered.country order by ordered.first_day)
        from (
          select td.country, min(td.day_number) as first_day
          from public.trip_days td
          where td.trip_id = t.id
            and td.country is not null
            and btrim(td.country) <> ''
          group by td.country
        ) ordered
      ),
      '{}'::text[]
    ) as countries
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  where i.code = invite_code
    and i.revoked = false
    and (i.expires_at is null or i.expires_at > now())
  limit 1;
$$;

revoke all on function public.resolve_trip_invite(text) from public;
grant execute on function public.resolve_trip_invite(text) to anon, authenticated;
