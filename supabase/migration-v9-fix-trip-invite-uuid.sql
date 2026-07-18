-- The v8 function was deployed with uuid_generate_v4(), which Supabase installs
-- in the extensions schema. Include that trusted schema so already-deployed v8
-- function bodies can resolve it. Fresh installs use gen_random_uuid() from the
-- corrected v8 migration and remain compatible with this setting.
alter function public.create_trip_v2(text, text, text, jsonb, jsonb)
  set search_path = public, extensions;
