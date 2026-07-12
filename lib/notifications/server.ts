// Server-side notification engine, shared by the dispatch and cron routes.
// Runs against Supabase with the same anon key as the client (RLS is open —
// the app has no auth) and sends web push via VAPID.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import webpush, { type PushSubscription as WebPushSubscription } from 'web-push';
import {
  BATCH_MAX_AGE_MINUTES,
  BATCH_MIN_COUNT,
  BATCHED_EVENT_TYPES,
  EVENT_CONFIG,
  TRIP_ID,
  TRIP_NAME,
  type EventType,
} from './config';

interface EventRow {
  id: string;
  trip_id: string;
  event_type: string;
  actor_id: string | null;
  recipient_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface StateRow {
  profile_id: string;
  trip_id: string;
  last_seen_at: string;
  last_notified_at: string;
}

interface SubscriptionRow {
  id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function notificationsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
  );
}

function serverClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false } }
  );
}

// Thrown when the VAPID env values are present but malformed (e.g. a public
// key that isn't clean URL-safe base64). Routes turn this into a readable
// JSON 500 instead of an empty-body crash.
export class NotificationConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationConfigError';
  }
}

function configureWebPush() {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string
    );
  } catch (err) {
    throw new NotificationConfigError(
      `Invalid VAPID configuration — check NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT: ${(err as Error).message}`
    );
  }
}

// Send one payload to every device a profile has registered. Subscriptions the
// push service reports as gone (404/410) are deleted so they never retry.
async function sendToProfile(
  db: SupabaseClient,
  profileId: string,
  payload: { title: string; body: string; tag: string; url: string }
): Promise<number> {
  const { data } = await db
    .from('push_subscriptions')
    .select('*')
    .eq('profile_id', profileId);
  const subs = (data ?? []) as SubscriptionRow[];
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub) => {
      const target: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(target, JSON.stringify(payload), {
          TTL: 60 * 60 * 24,
        });
        delivered += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.from('push_subscriptions').delete().eq('id', sub.id);
        }
        // Other failures (5xx, network) are dropped; the batch stays
        // unnotified and the next dispatch/cron retries naturally.
      }
    })
  );
  return delivered;
}

// "3 expenses, 2 photos" — aggregate counts per event type, config order.
function summarize(events: EventRow[]): string {
  const counts = new Map<EventType, number>();
  for (const e of events) {
    const t = e.event_type as EventType;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return (Object.keys(EVENT_CONFIG) as EventType[])
    .filter((t) => counts.has(t))
    .map((t) => {
      const n = counts.get(t)!;
      return `${n} ${n === 1 ? EVENT_CONFIG[t].singular : EVENT_CONFIG[t].plural}`;
    })
    .join(', ');
}

// Evaluate the batching rule for every subscribed profile and push where due.
// `enforceAge` is set by the cron: it also flushes batches whose oldest event
// exceeds BATCH_MAX_AGE_MINUTES, regardless of count.
export async function dispatchBatched(enforceAge: boolean): Promise<{
  notified: string[];
}> {
  const db = serverClient();
  configureWebPush();

  // Only people with at least one push subscription can be notified.
  const { data: subRows } = await db
    .from('push_subscriptions')
    .select('profile_id');
  const subscribed = [...new Set((subRows ?? []).map((r) => r.profile_id as string))];
  if (subscribed.length === 0) return { notified: [] };

  const { data: stateRows } = await db
    .from('notification_state')
    .select('*')
    .eq('trip_id', TRIP_ID)
    .in('profile_id', subscribed);
  const stateOf = new Map((stateRows ?? []).map((s: StateRow) => [s.profile_id, s]));

  // One query for everyone: broadcast batched events newer than the earliest
  // watermark among subscribed profiles.
  const watermarkOf = (profileId: string): string => {
    const s = stateOf.get(profileId);
    if (!s) return new Date(0).toISOString();
    return s.last_seen_at > s.last_notified_at ? s.last_seen_at : s.last_notified_at;
  };
  const earliest = subscribed.map(watermarkOf).sort()[0];

  const { data: eventRows } = await db
    .from('activity_events')
    .select('*')
    .eq('trip_id', TRIP_ID)
    .is('recipient_id', null)
    .in('event_type', BATCHED_EVENT_TYPES)
    .gt('created_at', earliest)
    .order('created_at', { ascending: true });
  const events = (eventRows ?? []) as EventRow[];
  if (events.length === 0) return { notified: [] };

  const cutoff = Date.now() - BATCH_MAX_AGE_MINUTES * 60_000;
  const notified: string[] = [];

  for (const profileId of subscribed) {
    const watermark = watermarkOf(profileId);
    const mine = events.filter(
      (e) => e.created_at > watermark && e.actor_id !== profileId
    );
    if (mine.length === 0) continue;

    const countDue = mine.length >= BATCH_MIN_COUNT;
    const ageDue =
      enforceAge && new Date(mine[0].created_at).getTime() < cutoff;
    if (!countDue && !ageDue) continue;

    const delivered = await sendToProfile(db, profileId, {
      title: TRIP_NAME,
      body: `${mine.length} update${mine.length === 1 ? '' : 's'} in ${TRIP_NAME} — ${summarize(mine)}`,
      tag: TRIP_ID, // newer digest replaces the older one instead of stacking
      url: '/',
    });

    // Advance the watermark to the newest event covered by this digest (not
    // now()), so events landing mid-send are never skipped. Advance even when
    // every device failed transiently — the events were consumed by this
    // attempt; endpoint-gone devices were already pruned.
    if (delivered >= 0) {
      await db.from('notification_state').upsert(
        {
          profile_id: profileId,
          trip_id: TRIP_ID,
          last_notified_at: mine[mine.length - 1].created_at,
        },
        { onConflict: 'profile_id,trip_id' }
      );
      notified.push(profileId);
    }
  }

  return { notified };
}

// Push a targeted immediate-tier event (e.g. added to an expense split) to its
// recipient right away. Batching and watermarks are not involved.
export async function sendImmediate(eventId: string): Promise<boolean> {
  const db = serverClient();
  configureWebPush();

  const { data } = await db
    .from('activity_events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();
  const event = data as EventRow | null;
  if (!event || !event.recipient_id) return false;
  const cfg = EVENT_CONFIG[event.event_type as EventType];
  if (!cfg || cfg.tier !== 'immediate') return false;
  if (event.recipient_id === event.actor_id) return false;

  const p = event.payload as { actor_name?: string; label?: string; amount_gbp?: string };
  const who = p.actor_name || 'Someone';
  const what = p.label ? ` for "${p.label}"` : '';
  const owed = p.amount_gbp ? ` — you owe ${p.amount_gbp}` : '';

  const delivered = await sendToProfile(db, event.recipient_id, {
    title: TRIP_NAME,
    body: `${who} added you to a split${what}${owed}`,
    // Distinct tag per event: immediate pushes must not replace the digest
    // (or each other).
    tag: `${TRIP_ID}:immediate:${event.id}`,
    url: '/',
  });
  return delivered > 0;
}
