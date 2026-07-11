// Static logistics reference for Tab 3: transit/hotel cards and a mini
// phrasebook. Edit these to match your real bookings.

export interface RefStop {
  destination: string;
  accentHex: string;
  lines: { label: string; value: string }[];
}

export const REFERENCE: RefStop[] = [
  {
    destination: 'Bangkok',
    accentHex: '#c9992e',
    lines: [
      { label: 'Arrive', value: 'Thu 28 Aug · 5:00 PM · Suvarnabhumi (BKK)' },
      { label: 'Hotel', value: 'Sukhumvit — add address for the taxi driver' },
      { label: 'Nights', value: '3 nights (28–31 Aug)' },
    ],
  },
  {
    destination: 'Phuket',
    accentHex: '#2f97a6',
    lines: [
      { label: 'Transfer', value: 'Sun 31 Aug · BKK → HKT flight' },
      { label: 'Hotel', value: 'Kata Beach area — add address' },
      { label: 'Nights', value: '3 nights (31 Aug–3 Sep)' },
    ],
  },
  {
    destination: 'Saigon (HCMC)',
    accentHex: '#b0472f',
    lines: [
      { label: 'Transfer', value: 'Wed 3 Sep · HKT → SGN flight' },
      { label: 'Hotel', value: 'District 1 — add address' },
      { label: 'Nights', value: '4 nights (3–7 Sep)' },
    ],
  },
  {
    destination: 'Nha Trang',
    accentHex: '#3f9b8a',
    lines: [
      { label: 'Transfer', value: 'Sun 7 Sep · SGN → CXR flight' },
      { label: 'Hotel', value: 'Beachfront — add address' },
      { label: 'Nights', value: '3 nights (7–10 Sep)' },
    ],
  },
];

export interface Phrase {
  en: string;
  local: string;
  say: string; // rough pronunciation
}

export const PHRASES: { lang: string; items: Phrase[] }[] = [
  {
    lang: 'Thai',
    items: [
      { en: 'Hello', local: 'สวัสดี', say: 'sa-wat-dee' },
      { en: 'Thank you', local: 'ขอบคุณ', say: 'khop-khun' },
      { en: 'How much?', local: 'เท่าไหร่', say: 'tao-rai' },
      { en: 'Delicious', local: 'อร่อย', say: 'a-roi' },
      { en: 'No spicy', local: 'ไม่เผ็ด', say: 'mai-pet' },
    ],
  },
  {
    lang: 'Vietnamese',
    items: [
      { en: 'Hello', local: 'Xin chào', say: 'sin-chow' },
      { en: 'Thank you', local: 'Cảm ơn', say: 'kam-un' },
      { en: 'How much?', local: 'Bao nhiêu', say: 'bao-nyew' },
      { en: 'Delicious', local: 'Ngon', say: 'ngon' },
      { en: 'Too expensive', local: 'Đắt quá', say: 'dat-kwa' },
    ],
  },
];
