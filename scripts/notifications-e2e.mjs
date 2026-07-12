// End-to-end smoke test for the batched notification system, hitting a
// DEPLOYED app plus the Supabase REST API directly (no npm deps — plain
// fetch). Creates throwaway profiles/events, exercises every rule, cleans up.
//
// Run:  APP_URL=https://… SUPABASE_URL=https://….supabase.co \
//       SUPABASE_ANON_KEY=… CRON_SECRET=… node scripts/notifications-e2e.mjs
// Or via the notifications-e2e GitHub Actions workflow (workflow_dispatch).

const APP_URL = process.env.APP_URL?.replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET ?? '';
const TRIP = 'thailand-vietnam-2026';

if (!APP_URL || !SUPABASE_URL || !ANON) {
  console.error('APP_URL, SUPABASE_URL, and SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}`);
  if (!cond) failures += 1;
};

// Minimal PostgREST helper.
async function rest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const api = (path, init) => fetch(`${APP_URL}/api/notifications/${path}`, init);
const postJson = (path, body) =>
  api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// Parse a response body without ever throwing on empty / non-JSON output
// (e.g. a 500 with no body). Prints a readable diagnostic for error responses
// so a misconfiguration surfaces as a clear line instead of a crash.
async function readBody(res) {
  const text = await res.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }
  if (res.status >= 400 || !text) {
    console.log(`  ↳ ${res.status} ${text ? text.slice(0, 200) : '(empty body)'}`);
  }
  return parsed;
}

// A syntactically valid subscription whose endpoint the push service will
// reject with 404/410 — exercises delivery *and* the pruning path.
const deadSub = (suffix) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/dead-e2e-${suffix}-${Date.now()}`,
  keys: {
    p256dh:
      'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
    auth: 'tBHItJI5svbpez7KI4CCXg',
  },
});

const [actor] = await rest('POST', 'profiles', { name: `__e2e_actor_${Date.now()}` });
const [recip] = await rest('POST', 'profiles', { name: `__e2e_recip_${Date.now()}` });

try {
  // 1. subscribe flow
  let r = await postJson('subscribe', { profileId: recip.id, subscription: deadSub('a') });
  check('subscribe accepts a valid subscription', r.status === 200);
  r = await postJson('subscribe', { profileId: recip.id });
  check('subscribe rejects malformed body (400)', r.status === 400);
  const stateRows = await rest(
    'GET',
    `notification_state?profile_id=eq.${recip.id}&select=*`
  );
  check('notification_state row created on subscribe', stateRows.length === 1);

  // 2. count rule: 4 events → no digest; 5th → digest
  const mkEvent = async (type, payload = {}, recipientId = null) =>
    (
      await rest('POST', 'activity_events', {
        trip_id: TRIP,
        event_type: type,
        actor_id: actor.id,
        recipient_id: recipientId,
        payload,
      })
    )[0];
  for (let i = 0; i < 3; i++) await mkEvent('expense_added', { label: `e2e ${i}` });
  await mkEvent('photo_added');
  let d = readBody(await postJson('dispatch', {}));
  check('4 events do not trigger a digest', d.notified === 0);
  await mkEvent('photo_added');
  d = readBody(await postJson('dispatch', {}));
  check('5th event triggers the digest (count rule)', d.notified === 1);

  // 3. dead subscription pruned on 404/410, watermark advanced
  const subsAfter = await rest(
    'GET',
    `push_subscriptions?profile_id=eq.${recip.id}&select=id`
  );
  check('dead subscription deleted after 404/410', subsAfter.length === 0);
  const [st2] = await rest('GET', `notification_state?profile_id=eq.${recip.id}&select=*`);
  check('watermark advanced past digested events', st2.last_notified_at > st2.last_seen_at);

  // 4. never notified about own actions
  await postJson('subscribe', { profileId: actor.id, subscription: deadSub('actor') });
  for (let i = 0; i < 6; i++) await mkEvent('expense_added', { label: `own ${i}` });
  d = readBody(await postJson('dispatch', {}));
  check('actor never notified about own events', d.notified === 0);

  // 5. age rule via cron (backdate watermark + event past the 2h threshold)
  await postJson('subscribe', { profileId: recip.id, subscription: deadSub('b') });
  const old = new Date(Date.now() - 4 * 3600_000).toISOString();
  const threeHrsAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
  await rest('PATCH', `notification_state?profile_id=eq.${recip.id}`, {
    last_seen_at: old,
    last_notified_at: old,
  });
  const aged = await mkEvent('activity_added', { title: 'aged e2e event' });
  await rest('PATCH', `activity_events?id=eq.${aged.id}`, { created_at: threeHrsAgo });
  d = readBody(await postJson('dispatch', {}));
  check('single aged event does not flush via dispatch (count rule only)', d.notified === 0);
  r = await api('cron');
  check('cron rejects a missing secret (401)', r.status === 401);
  d = await readBody(
    await api('cron', { headers: { Authorization: `Bearer ${CRON_SECRET}` } })
  );
  check('cron flushes the >2h-old batch (age rule)', d.notified === 1);

  // 6. seen-in-app events never push
  await postJson('subscribe', { profileId: recip.id, subscription: deadSub('c') });
  for (let i = 0; i < 5; i++) await mkEvent('photo_added');
  await rest('PATCH', `notification_state?profile_id=eq.${recip.id}`, {
    last_seen_at: new Date().toISOString(),
  });
  d = readBody(await postJson('dispatch', {}));
  check('events seen in-app never push (last_seen_at watermark)', d.notified === 0);

  // 7. immediate tier: targeted event is attempted instantly, not batched
  const imm = await mkEvent(
    'expense_split_added',
    { label: 'E2E dinner', amount_gbp: '£5.00', actor_name: 'E2E' },
    recip.id
  );
  d = await readBody(await postJson('dispatch', { eventId: imm.id }));
  check('immediate event handled without a digest', d.notified === 0);
} finally {
  // Cleanup: cascades delete subscriptions, state, and targeted events.
  await rest('DELETE', `activity_events?actor_id=eq.${actor.id}`, undefined, {
    Prefer: 'return=minimal',
  });
  await rest('DELETE', `profiles?id=in.(${actor.id},${recip.id})`, undefined, {
    Prefer: 'return=minimal',
  });
  console.log('cleanup done');
}

if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('all checks passed');
