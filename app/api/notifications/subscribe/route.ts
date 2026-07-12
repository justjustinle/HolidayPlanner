import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TRIP_ID } from '@/lib/notifications/config';

// POST /api/notifications/subscribe
//   { profileId, subscription: { endpoint, keys: { p256dh, auth } } }
// Persists a device's push subscription. A person can hold many rows (one per
// device); re-subscribing from the same device updates the existing row, and
// a device previously registered to another profile is re-owned (shared iPad
// scenario — last person to enable push on it wins).

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
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

  const db = createClient(url, anonKey, { auth: { persistSession: false } });

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
