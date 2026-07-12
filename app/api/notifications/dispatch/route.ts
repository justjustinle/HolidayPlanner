import { NextResponse } from 'next/server';
import {
  dispatchBatched,
  NotificationConfigError,
  notificationsConfigured,
  sendImmediate,
} from '@/lib/notifications/server';

// POST /api/notifications/dispatch  { eventId? }
// Fired (best-effort) by the client right after it records an activity event.
// - If eventId points at an immediate-tier event, it's pushed to its
//   recipient right away.
// - Then the count rule runs: any recipient sitting on BATCH_MIN_COUNT+
//   unnotified events gets their digest now. The age rule is the cron's job.

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!notificationsConfigured()) {
    return NextResponse.json(
      { error: 'Push notifications are not configured.' },
      { status: 503 }
    );
  }

  let eventId: string | undefined;
  try {
    const body = await req.json();
    eventId = typeof body?.eventId === 'string' ? body.eventId : undefined;
  } catch {
    // No body is fine — just run the batch pass.
  }

  try {
    const immediate = eventId ? await sendImmediate(eventId) : false;
    const { notified } = await dispatchBatched(false);
    return NextResponse.json({ ok: true, immediate, notified: notified.length });
  } catch (err) {
    // Never leak an empty-body 500 — return a readable JSON error so callers
    // (and the E2E) can see what went wrong. Config problems get a distinct
    // 500 code path for clarity.
    return NextResponse.json(
      {
        error: (err as Error).message,
        kind: err instanceof NotificationConfigError ? 'config' : 'runtime',
      },
      { status: 500 }
    );
  }
}
