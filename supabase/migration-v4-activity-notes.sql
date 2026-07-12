-- Activity misc notes on itinerary items (booking refs, meet points, etc.).
alter table itinerary_items
  add column if not exists notes text;
