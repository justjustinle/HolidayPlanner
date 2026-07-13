// End-to-end smoke test for the batched notification system, hitting a
// DEPLOYED app plus the Supabase REST API directly (no npm deps — plain
// fetch). Runs in an ISOLATED test trip namespace so it never touches the
// real trip's events or pushes to real subscribers, and asserts on whether
// the specific test recipient was notified (dispatch/cron return notifiedIds).
//
// Run:  APP_URL=https://… SUPABASE_URL=https://….supabase.co \
//       SUPABASE_ANON_KEY=… CRON_SECRET=… node scripts/notifications-e2e.mjs
// Or via the notifications-e2e GitHub Actions workflow (workflow_dispatch).

const APP_URL = process.env.APP_URL?.replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET ?? '';
const TEST_TRIP = `e2e-${Date.now()}`; // isolated namespace, cleaned up at the end

if (!APP_URL || !SUPABASE_URL || !ANON) {
  console.error('APP_URL, SUPABASE_URL, and SUPABASE_ANON_KEY are required.');
  process.exit(1);
}
console.log(`test trip: ${TEST_TRIP}`);

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

// Give the recipient a device (fresh subscription) — call before each phase
// that expects a send, since being notified prunes the dead endpoint.
const subscribeRecip = (id, suffix) =>
  postJson('subscribe', { profileId: id, subscription: deadSub(suffix) });

// Upsert the recipient's watermark for the TEST trip.
const setWatermark = (id, seen, notified) =>
  rest(
    'POST',
    'notification_state?on_conflict=profile_id,trip_id',
    { profile_id: id, trip_id: TEST_TRIP, last_seen_at: seen, last_notified_at: notified },
    { Prefer: 'resolution=merge-duplicates,return=minimal' }
  );

// Insert a TEST-trip activity event. author=null actor is fine; recipientId
// set makes it a targeted (immediate-tier) event.
const mkEvent = async (type, authorId, payload = {}, recipientId = null, createdAt) =>
  (
    await rest('POST', 'activity_events', {
      trip_id: TEST_TRIP,
      event_type: type,
      actor_id: authorId,
      recipient_id: recipientId,
      payload,
      ...(createdAt ? { created_at: createdAt } : {}),
    })
  )[0];

const dispatch = async (body) =>
  readBody(await postJson('dispatch', { tripId: TEST_TRIP, ...body }));
const notifiedRecip = (d, id) => Array.isArray(d.notifiedIds) && d.notifiedIds.includes(id);

// Clear all test-trip events so each phase is independent (a backdated
// watermark in one phase must not pick up another phase's events).
const resetEvents = () =>
  rest('DELETE', `activity_events?trip_id=eq.${TEST_TRIP}`, undefined, {
    Prefer: 'return=minimal',
  });

const iso = (msAgo = 0) => new Date(Date.now() - msAgo).toISOString();

const [recip] = await rest('POST', 'profiles', { name: `__e2e_recip_${Date.now()}` });
const [other] = await rest('POST', 'profiles', { name: `__e2e_other_${Date.now()}` });

try {
  // 1. subscribe endpoint (operates on the real trip — that's what it does)
  let r = await subscribeRecip(recip.id, 'a');
  check('subscribe accepts a valid subscription', r.status === 200);
  r = await postJson('subscribe', { profileId: recip.id });
  check('subscribe rejects malformed body (400)', r.status === 400);
  const stateRows = await rest('GET', `notification_state?profile_id=eq.${recip.id}&select=*`);
  check('notification_state row created on subscribe', stateRows.length >= 1);

  // 1b. unsubscribe (DELETE) removes the device row
  const [subRow] = await rest(
    'GET',
    `push_subscriptions?profile_id=eq.${recip.id}&select=endpoint&limit=1`
  );
  r = await api('subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: recip.id, endpoint: subRow.endpoint }),
  });
  check('unsubscribe deletes the subscription (200)', r.status === 200);
  const afterUnsub = await rest(
    'GET',
    `push_subscriptions?profile_id=eq.${recip.id}&select=id`
  );
  check('no push_subscriptions rows after unsubscribe', afterUnsub.length === 0);
  // Re-subscribe for the remaining phases.
  await subscribeRecip(recip.id, 'a2');

  // 2. count rule: 4 events → no digest; 5th → digest (recipient-scoped)
  await resetEvents();
  await setWatermark(recip.id, iso(), iso());
  for (let i = 0; i < 4; i++) await mkEvent('expense_added', other.id, { label: `e2e ${i}` });
  let d = await dispatch({});
  check('4 events do not notify the recipient', !notifiedRecip(d, recip.id));
  await mkEvent('photo_added', other.id);
  d = await dispatch({});
  check('5th event notifies the recipient (count rule)', notifiedRecip(d, recip.id));

  // 3. dead subscription pruned on 404/410, watermark advanced
  const subsAfter = await rest('GET', `push_subscriptions?profile_id=eq.${recip.id}&select=id`);
  check('dead subscription deleted after 404/410', subsAfter.length === 0);
  const [st] = await rest(
    'GET',
    `notification_state?profile_id=eq.${recip.id}&trip_id=eq.${TEST_TRIP}&select=*`
  );
  check('watermark advanced past digested events', st.last_notified_at > st.last_seen_at);

  // 4. never notified about own actions
  await resetEvents();
  await subscribeRecip(recip.id, 'own');
  await setWatermark(recip.id, iso(), iso());
  for (let i = 0; i < 5; i++) await mkEvent('expense_added', recip.id, { label: `own ${i}` });
  d = await dispatch({});
  check('recipient is not notified about their own events', !notifiedRecip(d, recip.id));

  // 5. age rule: 1 event older than 2h → not flushed by dispatch, flushed by cron
  await resetEvents();
  await subscribeRecip(recip.id, 'age');
  await setWatermark(recip.id, iso(4 * 3600_000), iso(4 * 3600_000));
  await mkEvent('activity_added', other.id, { title: 'aged' }, null, iso(3 * 3600_000));
  d = await dispatch({});
  check('single aged event is not flushed by dispatch (count rule only)', !notifiedRecip(d, recip.id));
  r = await api('cron');
  check('cron rejects a missing secret (401)', r.status === 401);
  d = await readBody(
    await api(`cron?tripId=${TEST_TRIP}`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
  );
  check('cron flushes the >2h-old batch (age rule)', notifiedRecip(d, recip.id));

  // 6. events already seen in-app never push
  await resetEvents();
  await subscribeRecip(recip.id, 'seen');
  await setWatermark(recip.id, iso(), iso());
  for (let i = 0; i < 5; i++) await mkEvent('photo_added', other.id);
  await setWatermark(recip.id, iso(), iso()); // mark seen AFTER the events
  d = await dispatch({});
  check('events seen in-app never push (last_seen_at watermark)', !notifiedRecip(d, recip.id));

  // 7. immediate tier: targeted event handled without a batch digest
  await resetEvents();
  await subscribeRecip(recip.id, 'imm');
  await setWatermark(recip.id, iso(), iso());
  const imm = await mkEvent(
    'expense_split_added',
    other.id,
    { label: 'E2E dinner', amount_gbp: '£5.00', actor_name: 'E2E' },
    recip.id
  );
  d = await dispatch({ eventId: imm.id });
  check('immediate event handled without a batch digest', !notifiedRecip(d, recip.id));
} finally {
  // Cleanup: everything in the test trip, then the throwaway profiles.
  await rest('DELETE', `activity_events?trip_id=eq.${TEST_TRIP}`, undefined, {
    Prefer: 'return=minimal',
  });
  await rest('DELETE', `notification_state?trip_id=eq.${TEST_TRIP}`, undefined, {
    Prefer: 'return=minimal',
  });
  await rest('DELETE', `profiles?id=in.(${recip.id},${other.id})`, undefined, {
    Prefer: 'return=minimal',
  });
  console.log('cleanup done');
}

if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('all checks passed');
