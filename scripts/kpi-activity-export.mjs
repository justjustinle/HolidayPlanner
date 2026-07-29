// KPI activity export — INTERNAL, not consumer-facing.
//
// Reads the activity_events log (which is tagged with the acting profile) plus
// the profiles table straight from the Supabase REST API (no npm deps, plain
// fetch), then writes a per-user activity report to disk:
//
//   kpi-activity-report.json  — machine-readable: totals + per-user breakdown
//   kpi-activity-report.md    — human-readable summary for the launch KPI deck
//
// Every meaningful write in the app is logged by TripDataProvider (see
// logKpiEvent / recordActivity there). This script is the "output the KPIs to a
// file" half — run it out-of-band (GitHub Actions workflow kpi-activity-export,
// or locally with credentials), never from the client.
//
// Run:  SUPABASE_URL=https://….supabase.co SUPABASE_ANON_KEY=… \
//       [TRIP_ID=<uuid|all>] [OUT_DIR=.] node scripts/kpi-activity-export.mjs

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY;
// Default to the app's single active trip (matches lib/activeTrip.ts). Pass
// TRIP_ID=all to aggregate every trip in the database.
const TRIP_ID = process.env.TRIP_ID ?? '11111111-1111-1111-1111-111111111111';
const OUT_DIR = process.env.OUT_DIR ?? '.';

if (!SUPABASE_URL || !ANON) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

// Human labels for each event type we log. Keep in sync with the event_type
// strings passed to logKpiEvent / recordActivity in TripDataProvider.tsx.
const EVENT_LABELS = {
  activity_added: 'Activities added',
  activity_edited: 'Activities edited',
  activity_deleted: 'Activities deleted',
  photo_added: 'Photos added',
  photo_deleted: 'Photos deleted',
  expense_added: 'Expenses added',
  expense_edited: 'Expenses edited',
  expense_deleted: 'Expenses deleted',
  receipt_edited: 'Receipts edited',
  item_claimed: 'Receipt items claimed',
  item_released: 'Receipt items released',
  settlement_added: 'Settlements logged',
  stat_updated: 'Stat counters updated',
  rates_updated: 'FX rates updated',
};

// expense_split_added is a notification fan-out artifact (one row per split
// participant, duplicating the parent expense_added), not a distinct user
// action — exclude it from activity KPIs so a big group split doesn't inflate
// the payer's count.
const EXCLUDED_EVENTS = new Set(['expense_split_added']);

// Minimal PostgREST GET helper with cursor pagination (Supabase caps rows).
async function fetchAll(path) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        Range: `${from}-${from + pageSize - 1}`,
      },
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

const tripFilter = TRIP_ID === 'all' ? '' : `&trip_id=eq.${TRIP_ID}`;

const [events, profiles] = await Promise.all([
  fetchAll(
    `activity_events?select=id,event_type,actor_id,created_at,payload&order=created_at.asc${tripFilter}`
  ),
  fetchAll('profiles?select=id,name'),
]);

const nameOf = new Map(profiles.map((p) => [p.id, p.name]));

// Group into per-user buckets. Unknown/absent actor (actor_id null — e.g. a
// deleted profile) is bucketed under "(unattributed)" so nothing is dropped.
const perUser = new Map();
let counted = 0;
for (const e of events) {
  if (EXCLUDED_EVENTS.has(e.event_type)) continue;
  counted += 1;
  const key = e.actor_id ?? '__unattributed__';
  let bucket = perUser.get(key);
  if (!bucket) {
    bucket = {
      user_id: e.actor_id ?? null,
      name: e.actor_id ? nameOf.get(e.actor_id) ?? '(unknown profile)' : '(unattributed)',
      total: 0,
      by_type: {},
      first_at: e.created_at,
      last_at: e.created_at,
      events: [],
    };
    perUser.set(key, bucket);
  }
  bucket.total += 1;
  bucket.by_type[e.event_type] = (bucket.by_type[e.event_type] ?? 0) + 1;
  if (e.created_at < bucket.first_at) bucket.first_at = e.created_at;
  if (e.created_at > bucket.last_at) bucket.last_at = e.created_at;
  bucket.events.push({
    at: e.created_at,
    type: e.event_type,
    payload: e.payload ?? {},
  });
}

// Ensure every known profile appears, even with zero activity (a real KPI
// signal — who never engaged).
for (const p of profiles) {
  if (!perUser.has(p.id)) {
    perUser.set(p.id, {
      user_id: p.id,
      name: p.name,
      total: 0,
      by_type: {},
      first_at: null,
      last_at: null,
      events: [],
    });
  }
}

const users = [...perUser.values()].sort((a, b) => b.total - a.total);

const totalsByType = {};
for (const u of users) {
  for (const [type, n] of Object.entries(u.by_type)) {
    totalsByType[type] = (totalsByType[type] ?? 0) + n;
  }
}

const report = {
  generated_at: new Date().toISOString(),
  trip_id: TRIP_ID,
  totals: {
    events: counted,
    active_users: users.filter((u) => u.total > 0).length,
    known_profiles: profiles.length,
    by_type: totalsByType,
  },
  users,
};

// --- write JSON -----------------------------------------------------------
const jsonPath = join(OUT_DIR, 'kpi-activity-report.json');
writeFileSync(jsonPath, JSON.stringify(report, null, 2));

// --- write Markdown -------------------------------------------------------
const label = (t) => EVENT_LABELS[t] ?? t;
const lines = [];
lines.push('# Activity KPI report');
lines.push('');
lines.push(`Generated: ${report.generated_at}`);
lines.push(`Trip: \`${TRIP_ID}\``);
lines.push('');
lines.push(
  `**${counted}** logged activities across **${report.totals.active_users}** active ` +
    `of **${profiles.length}** profiles.`
);
lines.push('');
lines.push('## Activities per user');
lines.push('');
lines.push('| Rank | User | Activities | First | Last |');
lines.push('| ---: | --- | ---: | --- | --- |');
users.forEach((u, i) => {
  const first = u.first_at ? u.first_at.slice(0, 10) : '—';
  const last = u.last_at ? u.last_at.slice(0, 10) : '—';
  lines.push(`| ${i + 1} | ${u.name} | ${u.total} | ${first} | ${last} |`);
});
lines.push('');
lines.push('## Per-user breakdown by action');
lines.push('');
for (const u of users) {
  lines.push(`### ${u.name} — ${u.total} activities`);
  if (u.total === 0) {
    lines.push('');
    lines.push('_No logged activity._');
    lines.push('');
    continue;
  }
  const rows = Object.entries(u.by_type).sort((a, b) => b[1] - a[1]);
  for (const [type, n] of rows) lines.push(`- ${label(type)}: ${n}`);
  lines.push('');
}
lines.push('## Totals by action type');
lines.push('');
const totalRows = Object.entries(totalsByType).sort((a, b) => b[1] - a[1]);
for (const [type, n] of totalRows) lines.push(`- ${label(type)}: ${n}`);
lines.push('');

const mdPath = join(OUT_DIR, 'kpi-activity-report.md');
writeFileSync(mdPath, lines.join('\n'));

console.log(`Wrote ${jsonPath} and ${mdPath}`);
console.log(
  `${counted} activities · ${report.totals.active_users}/${profiles.length} profiles active`
);
