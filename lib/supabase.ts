import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AUTH_ENABLED } from './authConfig';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'memories';

// True when both env vars are present — the app then talks to real Supabase
// with realtime syncing. Otherwise it runs in local demo mode.
export const isSupabaseConfigured = Boolean(url && anonKey);

// A single shared browser client (or null in demo mode). When the Google-auth
// path is enabled we persist the session and pick it up from the OAuth redirect
// so authenticated requests carry the user's JWT (making RLS auth.uid() work);
// otherwise the pre-auth build never creates a session.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: AUTH_ENABLED,
        autoRefreshToken: AUTH_ENABLED,
        detectSessionInUrl: AUTH_ENABLED,
        flowType: 'pkce',
      },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;
