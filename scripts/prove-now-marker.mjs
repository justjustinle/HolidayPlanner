/**
 * Proof that itinerary time features work when the real calendar is
 * before the trip (e.g. 12 Jul 2026). Mocks Date for helpers + Playwright UI.
 *
 * Run: node scripts/prove-now-marker.mjs
 * Requires: next dev on :3000, Chrome, playwright-core installed.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

function dayNumberForDate(date) {
  const start = new Date(2026, 7, 28);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((day.getTime() - start.getTime()) / 86_400_000) + 1;
  return diff >= 1 && diff <= 13 ? diff : null;
}

function landingDayNumber(now = new Date()) {
  return dayNumberForDate(now) ?? 1;
}

function nowToMinutes(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(label) {
  if (!label) return Number.MAX_SAFE_INTEGER;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'AM') {
    if (h === 12) h = 0;
  } else if (ap === 'PM') {
    if (h !== 12) h += 12;
  }
  return h * 60 + min;
}

function formatClock(now = new Date()) {
  const minutes = now.getMinutes();
  let hour24 = now.getHours();
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Mirror ItineraryTab row builder
function buildRows(items, isToday, now) {
  if (!isToday) {
    return items.map((item) => ({ kind: 'item', item, past: false }));
  }
  const nowMins = nowToMinutes(now);
  const out = [];
  let inserted = false;
  for (const item of items) {
    const t = timeToMinutes(item.time_label);
    if (!inserted && nowMins < t) {
      out.push({ kind: 'now' });
      inserted = true;
    }
    out.push({ kind: 'item', item, past: t < nowMins });
  }
  if (!inserted) out.push({ kind: 'now' });
  return out;
}

const DAY1_ITEMS = [
  { id: 'a', time_label: '5:30 PM', title: 'Land BKK, taxi to hotel' },
  { id: 'b', time_label: '8:00 PM', title: 'Street food at Chinatown' },
];

let passed = 0;
let failed = 0;
const results = [];

function assert(name, cond, detail = '') {
  if (cond) {
    passed++;
    results.push({ ok: true, name, detail });
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    results.push({ ok: false, name, detail });
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n=== A. Helper: landingDayNumber / dayNumberForDate ===\n');

const cases = [
  ['2026-07-12 15:00', 1, null, 'before trip → Day 1, not on trip'],
  ['2026-08-27 23:59', 1, null, 'day before trip → Day 1'],
  ['2026-08-28 00:00', 1, 1, 'trip start midnight → Day 1'],
  ['2026-08-28 18:30', 1, 1, 'Day 1 evening'],
  ['2026-08-29 10:00', 2, 2, 'Day 2'],
  ['2026-08-31 12:00', 4, 4, 'Phuket Day 4'],
  ['2026-09-03 09:00', 7, 7, 'Saigon Day 7'],
  ['2026-09-09 20:00', 13, 13, 'last day'],
  ['2026-09-10 00:01', 1, null, 'after trip → Day 1 (not Day 13)'],
];

for (const [iso, expectLand, expectExact, note] of cases) {
  // Parse as local components to avoid UTC skew
  const [dPart, tPart] = iso.split(' ');
  const [y, mo, da] = dPart.split('-').map(Number);
  const [hh, mm] = tPart.split(':').map(Number);
  const d = new Date(y, mo - 1, da, hh, mm);
  const land = landingDayNumber(d);
  const exact = dayNumberForDate(d);
  assert(
    `landing(${iso}) === ${expectLand}`,
    land === expectLand && exact === expectExact,
    `${note} (got land=${land} exact=${exact})`
  );
}

console.log('\n=== B. Helper: now marker insert + dim past ===\n');

{
  const now = new Date(2026, 7, 28, 18, 30); // 6:30 PM Day 1
  const rows = buildRows(DAY1_ITEMS, true, now);
  const kinds = rows.map((r) => (r.kind === 'now' ? 'NOW' : `${r.item.time_label}${r.past ? '(dim)' : ''}`));
  assert(
    '6:30 PM sits between 5:30 and 8:00',
    kinds.join(' | ') === '5:30 PM(dim) | NOW | 8:00 PM',
    kinds.join(' | ')
  );
  assert('formatClock(18:30) === 6:30 PM', formatClock(now) === '6:30 PM', formatClock(now));
}

{
  const now = new Date(2026, 7, 28, 16, 0); // before first
  const rows = buildRows(DAY1_ITEMS, true, now);
  const kinds = rows.map((r) => (r.kind === 'now' ? 'NOW' : `${r.item.time_label}${r.past ? '(dim)' : ''}`));
  assert(
    '4:00 PM before first activity → Now on top, none dimmed',
    kinds.join(' | ') === 'NOW | 5:30 PM | 8:00 PM',
    kinds.join(' | ')
  );
}

{
  const now = new Date(2026, 7, 28, 21, 0); // after last
  const rows = buildRows(DAY1_ITEMS, true, now);
  const kinds = rows.map((r) => (r.kind === 'now' ? 'NOW' : `${r.item.time_label}${r.past ? '(dim)' : ''}`));
  assert(
    '9:00 PM after last → both dimmed, Now at bottom',
    kinds.join(' | ') === '5:30 PM(dim) | 8:00 PM(dim) | NOW',
    kinds.join(' | ')
  );
}

{
  const now = new Date(2026, 7, 28, 18, 30);
  const rows = buildRows(DAY1_ITEMS, false, now); // not today
  assert(
    'non-today day → no Now row, nothing dimmed',
    rows.every((r) => r.kind === 'item' && r.past === false) && !rows.some((r) => r.kind === 'now'),
    `rows=${rows.length}`
  );
}

console.log('\n=== C. UI (Playwright + mocked Date) ===\n');

const CHROME = process.env.CHROME_PATH || '/opt/google/chrome/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const ART = '/opt/cursor/artifacts/now-marker-proof';
mkdirSync(ART, { recursive: true });

function installFakeDate(isoLocal) {
  // isoLocal: '2026-08-28T18:30:00' interpreted as local wall clock
  return ({ isoLocal }) => {
    const [datePart, timePart] = isoLocal.split('T');
    const [y, mo, d] = datePart.split('-').map(Number);
    const [hh, mm, ss = '0'] = timePart.split(':');
    const fixed = new Date(y, mo - 1, d, Number(hh), Number(mm), Number(ss)).getTime();
    const RealDate = Date;
    class FakeDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) super(fixed);
        else super(...args);
      }
      static now() {
        return fixed;
      }
    }
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    // @ts-ignore
    window.Date = FakeDate;
  };
}

async function loginAsAlex(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Welcome gate: seed profile faces ("AAlex", etc.) or already logged in.
  const alex = page.getByRole('button', { name: /Alex/i }).first();
  if (await alex.isVisible().catch(() => false)) {
    await alex.click();
    await page.waitForTimeout(800);
  }
  // Wait until itinerary content is up (day chips or demo banner).
  await page.getByText('Itinerary').first().waitFor({ timeout: 15000 }).catch(() => {});
}

async function runUiCase({ name, fakeIso, expectTodayBadge, expectNow, expectDimTitles, expectNotDimTitles, dayChip }) {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(installFakeDate(fakeIso), { isoLocal: fakeIso });
  // Fresh identity each run
  await context.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });
  const page = await context.newPage();
  try {
    await loginAsAlex(page);
    // Ensure itinerary tab
    const itin = page.getByRole('button', { name: /Itinerary/i }).or(page.getByText('Itinerary'));
    if (await itin.first().isVisible().catch(() => false)) {
      await itin.first().click().catch(() => {});
    }
    await page.waitForTimeout(800);

    if (dayChip) {
      // Click a different day chip if needed (by destination label text on chip)
      const chip = page.getByRole('button', { name: new RegExp(dayChip, 'i') }).first();
      if (await chip.isVisible().catch(() => false)) {
        await chip.click();
        await page.waitForTimeout(400);
      }
    }

    const body = await page.locator('body').innerText();
    const hasToday = body.includes('· Today') || body.includes('Today');
    // More precise: heading area
    const todayInHeader = await page.locator('text=· Today').count();

    if (expectTodayBadge) {
      assert(`${name}: Today badge visible`, todayInHeader > 0 || /Day \d+ · .* · Today/.test(body), `todayCount=${todayInHeader}`);
    } else if (expectTodayBadge === false) {
      assert(`${name}: Today badge absent`, todayInHeader === 0, `todayCount=${todayInHeader}`);
    }

    const nowMarker = page.locator('[aria-label^="Now,"]');
    const nowCount = await nowMarker.count();
    if (expectNow) {
      assert(`${name}: Now marker present`, nowCount === 1, `count=${nowCount}`);
      if (nowCount === 1) {
        const label = await nowMarker.getAttribute('aria-label');
        assert(`${name}: Now clock matches mock`, label?.includes(expectNow), `aria-label=${label}`);
      }
    } else {
      assert(`${name}: Now marker absent`, nowCount === 0, `count=${nowCount}`);
    }

    for (const title of expectDimTitles || []) {
      const card = page.locator(`text=${title}`).first();
      const opacity = await card.evaluate((el) => {
        let n = el;
        while (n && n !== document.body) {
          const o = getComputedStyle(n).opacity;
          if (o && o !== '1') return o;
          n = n.parentElement;
        }
        return '1';
      });
      assert(`${name}: "${title}" dimmed`, parseFloat(opacity) < 0.9, `opacity=${opacity}`);
    }
    for (const title of expectNotDimTitles || []) {
      const card = page.locator(`text=${title}`).first();
      const opacity = await card.evaluate((el) => {
        let n = el;
        while (n && n !== document.body) {
          const o = getComputedStyle(n).opacity;
          if (o && o !== '1') return o;
          n = n.parentElement;
        }
        return '1';
      });
      assert(`${name}: "${title}" not dimmed`, parseFloat(opacity) >= 0.9, `opacity=${opacity}`);
    }

    const shot = `${ART}/${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({ path: shot, fullPage: false });
    console.log(`    📷 ${shot}`);
  } finally {
    await browser.close();
  }
}

// Day 1 demo activities: Dinner 5:30 PM, Night market 8:00 PM
await runUiCase({
  name: 'Jul12-before-trip',
  fakeIso: '2026-07-12T15:00:00',
  expectTodayBadge: false,
  expectNow: false,
  expectDimTitles: [],
  expectNotDimTitles: ['Land BKK, taxi to hotel', 'Street food at Chinatown'],
});

await runUiCase({
  name: 'Aug28-1830-between',
  fakeIso: '2026-08-28T18:30:00',
  expectTodayBadge: true,
  expectNow: '6:30 PM',
  expectDimTitles: ['Land BKK, taxi to hotel'],
  expectNotDimTitles: ['Street food at Chinatown'],
});

await runUiCase({
  name: 'Aug28-1600-before-first',
  fakeIso: '2026-08-28T16:00:00',
  expectTodayBadge: true,
  expectNow: '4:00 PM',
  expectDimTitles: [],
  expectNotDimTitles: ['Land BKK, taxi to hotel', 'Street food at Chinatown'],
});

await runUiCase({
  name: 'Aug28-2100-after-last',
  fakeIso: '2026-08-28T21:00:00',
  expectTodayBadge: true,
  expectNow: '9:00 PM',
  expectDimTitles: ['Land BKK, taxi to hotel', 'Street food at Chinatown'],
  expectNotDimTitles: [],
});

await runUiCase({
  name: 'Aug29-lands-day2-with-now',
  fakeIso: '2026-08-29T12:00:00',
  expectTodayBadge: true, // lands on Day 2 which is today
  expectNow: '12:00 PM',
  expectDimTitles: [],
});

// On Aug 28, switch away from today → Now disappears, past undimmed
await runUiCase({
  name: 'Aug28-switch-to-day4-no-now',
  fakeIso: '2026-08-28T18:30:00',
  expectTodayBadge: false,
  expectNow: false,
  dayChip: 'Phuket',
  expectDimTitles: [],
  expectNotDimTitles: ['Phi Phi island boat trip'],
});

console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
