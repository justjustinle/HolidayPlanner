// Generates simple PWA icons (no external deps) using a minimal PNG encoder.
// A warm cream field with a saffron sun and a turquoise wave — a tiny nod to
// the SEA-coast palette. Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}
const CREAM = hex('#f7f1e6');
const GOLD = hex('#c9992e');
const TEAL = hex('#2f97a6');
const INK = hex('#3a352c');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const cx = size / 2;
  const sunY = size * 0.42;
  const sunR = size * 0.2;
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let color = CREAM;
      // saffron sun
      if (Math.hypot(x - cx, y - sunY) < sunR) color = GOLD;
      // turquoise wave band across the lower third
      const waveBase = size * 0.66;
      const wave = waveBase + Math.sin((x / size) * Math.PI * 3) * size * 0.03;
      if (y > wave) color = y > wave + size * 0.06 ? INK : TEAL;
      const p = rowStart + 1 + x * 3;
      raw[p] = color[0];
      raw[p + 1] = color[1];
      raw[p + 2] = color[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });
for (const size of [192, 512]) {
  const out = new URL(`../public/icons/icon-${size}.png`, import.meta.url);
  writeFileSync(out, png(size));
  console.log('wrote', out.pathname);
}
