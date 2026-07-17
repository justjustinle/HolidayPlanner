import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client using the SERVICE ROLE key, which bypasses RLS.
// The cross-user server routes (notifications dispatch/cron, receipt scan) need
// this once Phase 2 locks down RLS, because they act on behalf of many users
// and cannot rely on any single caller's session.
//
// Falls back to null when the service-role key isn't set; callers should then
// use the anon client (correct for the pre-auth / open-RLS build).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServiceRoleConfigured = Boolean(url && serviceKey);

export function createAdminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
