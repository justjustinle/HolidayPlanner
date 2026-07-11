-- Migration v3 — run in the Supabase SQL editor on projects created before
-- this version. Fresh projects should just run schema.sql instead.
--
-- 1. The read-only Apple Health "steps" stat is gone, replaced by the
--    self-counted "cards" (card games won) category.
-- 2. Stats are now cumulative across the whole trip: per-day rows collapse
--    into a single day_number = 1 slot per person/category.

delete from stat_entries where category = 'steps';

-- Collapse any per-day rows into the day 1 slot (summing across days).
insert into stat_entries (user_id, day_number, category, count)
select user_id, 1, category, sum(count)
from stat_entries
group by user_id, category
on conflict (user_id, day_number, category)
do update set
  count = excluded.count,
  updated_at = timezone('utc'::text, now());

delete from stat_entries where day_number <> 1;

-- Swap 'steps' for 'cards' in the allowed categories.
alter table stat_entries drop constraint if exists stat_entries_category_check;
alter table stat_entries add constraint stat_entries_category_check
  check (category in ('poop', 'drink', 'mosquito', 'coffee', 'cards'));
