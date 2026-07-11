import { NextResponse } from 'next/server';

// POST /api/scan-receipt  { imageBase64, mimeType }
// Sends the receipt photo to Anthropic Claude and returns a normalized JSON
// payload: { merchant, currency, total, items: [{ name, quantity, price }] }.
// Requires ANTHROPIC_API_KEY (server-side env var).

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL_CANDIDATES = [
  ...(process.env.ANTHROPIC_MODEL ? [process.env.ANTHROPIC_MODEL] : []),
  'claude-3-5-haiku-latest', 
  'claude-3-5-sonnet-latest',
];

const PROMPT = `You are a receipt scanner for a group holiday expense app.
Read the receipt in the image and return ONLY a valid JSON object matching this schema. 
Do not include any conversational preamble or markdown code blocks (like \`\`\`json).

Shape:
{
  "merchant": string,            // shop/restaurant name, or "" if unreadable
  "currency": "VND"|"THB"|"GBP", // the receipt's currency; VND for Vietnam (₫/dong), THB for Thailand (฿/baht), GBP for pounds. Pick the closest if ambiguous.
  "total": number,               // grand total actually paid, in that currency
  "items": [                     // every purchasable line item
    { "name": string, "quantity": number, "price": number } // price = LINE TOTAL (qty × unit price), same currency
  ]
}

Rules:
1. Numbers must be plain numbers without thousands separators or currency symbols.
2. Skip tax, service charge, or subtotal lines as individual items (they are captured by "total").
3. If quantity is missing, use 1.
4. If the image is not a receipt, return {"merchant":"","currency":"THB","total":0,"items":[]}.`;

interface ScannedItem {
  name: string;
  quantity: number;
  price: number;
}

// Sniff base64 headers to get the genuine mime-type, protecting against frontend mismatches
function detectMimeType(base64Str: string, fallback: string): string {
  const chars = base64Str.substring(0, 16);
  if (chars.startsWith('iVBORw0KGgo')) return 'image/png';
  if (chars.startsWith('/9j/')) return 'image/jpeg';
  if (chars.startsWith('UklGR')) return 'image/webp';
  if (chars.startsWith('R0lGODlh')) return 'image/gif';
  return fallback;
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'Receipt scanning is not configured. Set ANTHROPIC_API_KEY in your environment.' },
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

  // Strip data URL headers (e.g. "data:image/png;base64,")
  const cleanBase64 = body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  // Auto-detect format based on the actual base64 content signature
  const verifiedMimeType = detectMimeType(cleanBase64, body.mimeType || 'image/jpeg');

  let res: Response | null = null;
  
  for (const model of MODEL_CANDIDATES) {
    const payload = {
      model: model,
      max_tokens: 2000,
      temperature: 0,
      system: "You are a precise data extraction engine. You output raw JSON only.",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: verifiedMimeType,
                data: cleanBase64,
              },
            },
            {
              type: 'text',
              text: PROMPT,
            },
          ],
        },
      ],
    };

    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (res.status !== 404 && res.status !== 400) break;
  }

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => '') : '';
    const status = res?.status ?? 502;
    return NextResponse.json(
      { error: `Anthropic request failed (${status}). ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const text: string | undefined = data?.content?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: 'Anthropic returned no text content' }, { status: 502 });
  }

  let parsed: {
    merchant?: string;
    currency?: string;
    total?: number;
    items?: Partial<ScannedItem>[];
  };
  
  try {
    const cleanText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
    parsed = JSON.parse(cleanText);
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
