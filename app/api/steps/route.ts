import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dayNumberForDate } from '@/lib/trip';

// POST /api/steps  { name, steps, date? }   (header: x-steps-token)
//
// Apple Health can't be read by a web app directly, so each person sets up a
// daily iOS Shortcuts automation that reads their step count from Health and
// POSTs it here (see README for the exact shortcut). The route upserts the
// value into stat_entries as the read-only "steps" stat.

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const expected = process.env.STEPS_WEBHOOK_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Steps webhook not configured. Set STEPS_WEBHOOK_TOKEN in your environment.' },
      { status: 503 }
    );
  }

  let body: { name?: string; steps?: number; date?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const token = req.headers.get('x-steps-token') ?? body.token;
  if (token !== expected) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const name = body.name?.trim();
  const steps = Math.max(0, Math.round(Number(body.steps) || 0));
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // Map the date (default: today) onto a trip day; ignore pushes outside the trip.
  const when = body.date ? new Date(`${body.date}T12:00:00`) : new Date();
  const dayNumber = dayNumberForDate(when);
  if (!dayNumber) {
    return NextResponse.json({ ok: true, skipped: 'date is outside the trip' });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: `No profile named "${name}"` }, { status: 404 });
  }

  const { error } = await supabase.from('stat_entries').upsert(
    {
      user_id: profile.id,
      day_number: dayNumber,
      category: 'steps',
      count: steps,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_number,category' }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, name: profile.name, dayNumber, steps });
}
