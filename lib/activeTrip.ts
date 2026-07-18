// The single trip this build operates on. Phase 1 of multi-tenant: the schema
// is now trip-scoped (every content row carries a trip_id), but the app still
// targets one hard-coded trip. Phase 3 replaces this constant with a live
// TripContext resolved from the `trips` table / the active-trip route param.
//
// MUST match the fixed uuid seeded by supabase/migration-v5-multitrip-phase1.sql.
export const ACTIVE_TRIP_ID = '11111111-1111-1111-1111-111111111111';
