-- Migration v17 — luggage check-in weight (before / after the holiday).
-- Extends allowed stat_entries categories so each person can log outbound and
-- return bag weight. Stored as integer tenths of a kilogram (e.g. 125 = 12.5 kg).

alter table stat_entries drop constraint if exists stat_entries_category_check;
alter table stat_entries add constraint stat_entries_category_check
  check (category in (
    'poop',
    'drink',
    'mosquito',
    'coffee',
    'cards',
    'luggage_before',
    'luggage_after'
  ));
