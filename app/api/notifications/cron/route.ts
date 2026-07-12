import { NextResponse } from 'next/server';
import {
  dispatchBatched,
  notificationsConfigured,
} from '@/lib/notifications/server';

// GET /api/notifications/cron
// Ticked every ~15 minutes by .github/workflows/notifications-cron.yml.
// Flushes digests whose oldest unnotified event is older than
// BATCH_MAX_AGE_MINUTES (the count rule also applies on the same pass).
// Requires `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!notificationsConfigured()) {
    return NextResponse.json(
      { error: 'Push notifications are not configured.' },
      { status: 503 }
    );
  }

  const { notified } = await dispatchBatched(true);
  return NextResponse.json({ ok: true, notified: notified.length });
}
