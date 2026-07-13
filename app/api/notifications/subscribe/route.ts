import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TRIP_ID } from '@/lib/notifications/config';

// POST /api/notifications/subscribe
//   { profileId, subscription: { endpoint, keys: { p256dh, auth } } }
// Persists a device's push subscription. A person can hold many rows (one per
// device); re-subscribing from the same device updates the existing row, and
// a device previously registered to another profile is re-owned (shared iPad
// scenario — last person to enable push on it wins).
//
// DELETE /api/notifications/subscribe
//   { profileId, endpoint }
// Removes this device's row so digests stop. Safe if the row is already gone.

export const runtime = 'nodejs';

function supabaseOr503() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  const db = supabaseOr503();
  if (!db) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  let body: {
    profileId?: string;
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { profileId, subscription } = body;
  if (
    !profileId ||
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return NextResponse.json(
      { error: 'profileId and a complete push subscription are required.' },
      { status: 400 }
    );
  }

  const { error } = await db.from('push_subscriptions').upsert(
    {
      profile_id: profileId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'endpoint' }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ensure the watermark row exists so history before enabling push is
  // treated as seen — only activity after this point can trigger a push.
  await db.from('notification_state').upsert(
    { profile_id: profileId, trip_id: TRIP_ID },
    { onConflict: 'profile_id,trip_id', ignoreDuplicates: true }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const db = supabaseOr503();
  if (!db) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  let body: { profileId?: string; endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { profileId, endpoint } = body;
  if (!profileId || !endpoint) {
    return NextResponse.json(
      { error: 'profileId and endpoint are required.' },
      { status: 400 }
    );
  }

  const { error, count } = await db
    .from('push_subscriptions')
    .delete({ count: 'exact' })
    .eq('profile_id', profileId)
    .eq('endpoint', endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
