// Master switch for the Phase 2 Google-auth path.
//
// When false (the default), the app behaves exactly as the pre-auth build: the
// Welcome Gate takes a name, RLS is open, and no Supabase session is created.
// Flip NEXT_PUBLIC_AUTH_ENABLED=true ONLY once the Google provider is
// configured in Supabase AND migration-v6-auth-rls.sql has been applied AND
// SUPABASE_SERVICE_ROLE_KEY is set — otherwise the locked-down policies reject
// every request. See docs/MULTI_TENANT.md.
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
