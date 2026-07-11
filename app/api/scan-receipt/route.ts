import { NextResponse } from 'next/server';

// POST /api/scan-receipt  { imageBase64, mimeType }
// Sends the receipt photo to Google Gemini and returns a normalized JSON
// payload: { merchant, currency, total, items: [{ name, quantity, price }] }.
// Requires GEMINI_API_KEY (server-side env var — see README).

export const runtime = 'nodejs';
export const maxDuration = 60;

// Models to try in order. Google keeps sunsetting older Gemini models for new
// API keys (1.5 already 404s on fresh projects), so we fall through to the
// next candidate whenever a model comes back 404 NOT_FOUND. GEMINI_MODEL, if
// set, is always tried first.
const MODEL_CANDIDATES = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const PROMPT = `You are a receipt scanner for a group holiday expense app.
Read the receipt in the image and return ONLY a JSON object with this exact shape:
{
  "merchant": string,            // shop/restaurant name, or "" if unreadable
  "currency": "VND"|"THB"|"GBP", // the receipt's currency; VND for Vietnam (₫/dong), THB for Thailand (฿/baht), GBP for pounds. Pick the closest if ambiguous.
  "total": number,               // grand total actually paid, in that currency
  "items": [                     // every purchasable line item
    { "name": string, "quantity": number, "price": number } // price = LINE TOTAL (qty × unit price), same currency
  ]
}
Rules: numbers must be plain numbers without separators or symbols. Skip tax/service/subtotal lines as items (they are captured by "total"). If quantity is missing use 1. If the image is not a receipt, return {"merchant":"","currency":"THB","total":0,"items":[]}.`;

interface ScannedItem {
  name: string;
  quantity: number;
  price: number;
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          'Receipt scanning is not configured. Set GEMINI_API_KEY in your environment (get a free key at https://aistudio.google.com/apikey), then redeploy.',
      },
      { status: 503 }
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
  }

  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: body.mimeType || 'image/webp',
              data: body.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0,
    },
  });

  let res: Response | null = null;
  for (const model of MODEL_CANDIDATES) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
    );
    if (res.status !== 404) break; // 404 = model unknown to this key; try the next one
  }

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => '') : '';
    const status = res?.status ?? 502;
    const hint =
      status === 404
        ? ` None of the models (${MODEL_CANDIDATES.join(', ')}) are available to this API key.`
        : '';
    return NextResponse.json(
      { error: `Gemini request failed (${status}).${hint} ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: 'Gemini returned no content' }, { status: 502 });
  }

  let parsed: {
    merchant?: string;
    currency?: string;
    total?: number;
    items?: Partial<ScannedItem>[];
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'Could not parse the scan result — try a clearer photo.' },
      { status: 502 }
    );
  }

  const currency = ['VND', 'THB', 'GBP'].includes(parsed.currency ?? '')
    ? parsed.currency
    : 'THB';
  const items: ScannedItem[] = (parsed.items ?? [])
    .map((i) => ({
      name: String(i.name ?? 'Item').slice(0, 120),
      quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
      price: Math.max(0, Number(i.price) || 0),
    }))
    .filter((i) => i.price > 0);
  const itemSum = items.reduce((s, i) => s + i.price, 0);

  return NextResponse.json({
    merchant: String(parsed.merchant ?? '').slice(0, 120),
    currency,
    total: Math.max(0, Number(parsed.total) || 0) || itemSum,
    items,
  });
}
