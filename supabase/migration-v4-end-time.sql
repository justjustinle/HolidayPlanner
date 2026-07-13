-- Optional activity end time (same label format as time_label).
alter table itinerary_items
  add column if not exists end_time_label text;
