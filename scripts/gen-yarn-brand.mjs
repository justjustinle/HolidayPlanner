// Generates Yarn brand SVG + PNG assets. Does not touch existing /public/icons/.
// Run: node scripts/gen-yarn-brand.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAND_DIR = join(__dirname, '../brand/yarn');

const COLORS = {
  gold: '#B8963E',
  terracotta: '#C4613A',
  teal: '#2A6875',
  forest: '#2F5A42',
  cream: '#F7F1E6',
  ink: '#3A352C',
};

/** Yarn-ball mark: filled circle with groove cutouts + trailing strand. */
function iconSvg(color, { id = 'ball' } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" role="img" aria-label="Yarn">
  <defs>
    <mask id="${id}-mask">
      <circle cx="56" cy="44" r="30" fill="white"/>
      <path d="M 27 44 C 37 28, 67 28, 77 44 C 67 60, 37 60, 27 44" fill="none" stroke="black" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 56 16 C 74 28, 74 60, 56 72" fill="none" stroke="black" stroke-width="6" stroke-linecap="round"/>
      <path d="M 34 56 C 56 46, 78 56" fill="none" stroke="black" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 38 32 C 56 44, 74 32" fill="none" stroke="black" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 42 62 C 56 52, 70 62" fill="none" stroke="black" stroke-width="5" stroke-linecap="round"/>
    </mask>
  </defs>
  <circle cx="56" cy="44" r="30" fill="${color}" mask="url(#${id}-mask)"/>
  <path d="M 30 58 C 20 64, 13 76, 7 88" stroke="${color}" stroke-width="7.5" stroke-linecap="round"/>
</svg>
`;
}

/** Dual-tone mark from the reference sheet: dark ball + terracotta strand. */
function iconDualSvg(ballColor, strandColor) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" role="img" aria-label="Yarn">
  <defs>
    <mask id="dual-mask">
      <circle cx="56" cy="44" r="30" fill="white"/>
      <path d="M 27 44 C 37 28, 67 28, 77 44 C 67 60, 37 60, 27 44" fill="none" stroke="black" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 56 16 C 74 28, 74 60, 56 72" fill="none" stroke="black" stroke-width="6" stroke-linecap="round"/>
      <path d="M 34 56 C 56 46, 78 56" fill="none" stroke="black" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 38 32 C 56 44, 74 32" fill="none" stroke="black" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 42 62 C 56 52, 70 62" fill="none" stroke="black" stroke-width="5" stroke-linecap="round"/>
    </mask>
  </defs>
  <circle cx="56" cy="44" r="30" fill="${ballColor}" mask="url(#dual-mask)"/>
  <path d="M 30 58 C 20 64, 13 76, 7 88" stroke="${strandColor}" stroke-width="7.5" stroke-linecap="round"/>
</svg>
`;
}

function wordmarkSvg(color, bg = 'transparent') {
  const bgRect =
    bg === 'transparent'
      ? ''
      : `<rect width="220" height="88" fill="${bg}" rx="12"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 88" role="img" aria-label="Yarn wordmark">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Varela+Round&amp;display=swap');
      .yarn-wordmark { font-family: 'Varela Round', system-ui, sans-serif; font-size: 56px; font-weight: 400; letter-spacing: -0.02em; }
    </style>
  </defs>
  ${bgRect}
  <text class="yarn-wordmark" x="110" y="60" text-anchor="middle" fill="${color}">Yarn</text>
</svg>
`;
}

function lockupSvg(iconColor, textColor, bg = COLORS.cream) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" fill="none" role="img" aria-label="Yarn lockup">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Varela+Round&amp;display=swap');
      .yarn-wordmark { font-family: 'Varela Round', system-ui, sans-serif; font-size: 44px; font-weight: 400; letter-spacing: -0.02em; }
    </style>
    <mask id="lockup-ball-mask">
      <circle cx="50" cy="50" r="30" fill="white"/>
      <path d="M 21 50 C 31 34, 61 34, 71 50 C 61 66, 31 66, 21 50" fill="none" stroke="black" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 50 22 C 68 34, 68 66, 50 78" fill="none" stroke="black" stroke-width="6" stroke-linecap="round"/>
      <path d="M 28 62 C 50 52, 72 62" fill="none" stroke="black" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 32 38 C 50 50, 68 38" fill="none" stroke="black" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 36 68 C 50 58, 64 68" fill="none" stroke="black" stroke-width="5" stroke-linecap="round"/>
    </mask>
  </defs>
  <rect width="280" height="100" fill="${bg}" rx="16"/>
  <circle cx="50" cy="50" r="30" fill="${iconColor}" mask="url(#lockup-ball-mask)"/>
  <path d="M 24 64 C 14 70, 8 80, 4 90" stroke="${iconColor}" stroke-width="7.5" stroke-linecap="round"/>
  <text class="yarn-wordmark" x="108" y="62" fill="${textColor}">Yarn</text>
</svg>
`;
}

// --- Minimal PNG rasteriser (same approach as gen-icons.mjs) ---

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

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

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function distToBezier(px, py, p0, p1, p2, p3) {
  let best = Infinity;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const p = bezierPoint(t, p0, p1, p2, p3);
    best = Math.min(best, Math.hypot(px - p.x, py - p.y));
  }
  return best;
}

function yarnIconMask(x, y, size) {
  const sx = (x / size) * 100;
  const sy = (y / size) * 100;
  const cx = 56;
  const cy = 44;
  const r = 30;
  const inBall = Math.hypot(sx - cx, sy - cy) <= r;
  if (!inBall) return false;

  const grooves = [
  distToSegment(sx, sy, 27, 44, 77, 44) < 3.25,
    distToBezier(sx, sy, { x: 56, y: 16 }, { x: 74, y: 28 }, { x: 74, y: 60 }, { x: 56, y: 72 }) < 3,
    distToBezier(sx, sy, { x: 34, y: 56 }, { x: 56, y: 46 }, { x: 78, y: 56 }, { x: 78, y: 56 }) < 2.75,
    distToBezier(sx, sy, { x: 38, y: 32 }, { x: 56, y: 44 }, { x: 74, y: 32 }, { x: 74, y: 32 }) < 2.75,
    distToBezier(sx, sy, { x: 42, y: 62 }, { x: 56, y: 52 }, { x: 70, y: 62 }, { x: 70, y: 62 }) < 2.5,
  ];
  return !grooves.some(Boolean);
}

function yarnStrandMask(x, y, size) {
  const sx = (x / size) * 100;
  const sy = (y / size) * 100;
  return (
    distToBezier(sx, sy, { x: 30, y: 58 }, { x: 20, y: 64 }, { x: 13, y: 76 }, { x: 7, y: 88 }) <
    3.75
  );
}

function pngIcon(size, fg, bg = null) {
  const fgRgb = hex(fg);
  const bgRgb = bg ? hex(bg) : null;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const onIcon = yarnIconMask(x, y, size) || yarnStrandMask(x, y, size);
      const color = onIcon ? fgRgb : bgRgb;
      const p = rowStart + 1 + x * 3;
      if (color) {
        raw[p] = color[0];
        raw[p + 1] = color[1];
        raw[p + 2] = color[2];
      } else {
        raw[p] = 0;
        raw[p + 1] = 0;
        raw[p + 2] = 0;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = bgRgb ? 2 : 6; // RGB or RGBA
  if (!bgRgb) {
    const rgba = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y++) {
      const rowStart = y * (size * 4 + 1);
      rgba[rowStart] = 0;
      for (let x = 0; x < size; x++) {
        const onIcon = yarnIconMask(x, y, size) || yarnStrandMask(x, y, size);
        const p = rowStart + 1 + x * 4;
        if (onIcon) {
          rgba[p] = fgRgb[0];
          rgba[p + 1] = fgRgb[1];
          rgba[p + 2] = fgRgb[2];
          rgba[p + 3] = 255;
        } else {
          rgba[p] = rgba[p + 1] = rgba[p + 2] = rgba[p + 3] = 0;
        }
      }
    }
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([
      sig,
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(rgba, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Write assets ---

const dirs = [
  BRAND_DIR,
  join(BRAND_DIR, 'icons'),
  join(BRAND_DIR, 'wordmarks'),
  join(BRAND_DIR, 'lockups'),
  join(BRAND_DIR, 'png'),
];
for (const d of dirs) mkdirSync(d, { recursive: true });

writeFileSync(join(BRAND_DIR, 'icon.svg'), iconSvg('currentColor', { id: 'master' }));

for (const [name, hexColor] of Object.entries(COLORS)) {
  if (name === 'cream' || name === 'ink') continue;
  writeFileSync(
    join(BRAND_DIR, 'icons', `icon-${name}.svg`),
    iconSvg(hexColor, { id: name }),
  );
}

writeFileSync(
  join(BRAND_DIR, 'icons', 'icon-dual-ink-terracotta.svg'),
  iconDualSvg(COLORS.ink, COLORS.terracotta),
);

for (const [name, hexColor] of Object.entries(COLORS)) {
  if (name === 'cream') continue;
  writeFileSync(
    join(BRAND_DIR, 'wordmarks', `wordmark-${name}.svg`),
    wordmarkSvg(hexColor),
  );
  writeFileSync(
    join(BRAND_DIR, 'wordmarks', `wordmark-${name}-on-cream.svg`),
    wordmarkSvg(hexColor, COLORS.cream),
  );
}

for (const [name, hexColor] of Object.entries(COLORS)) {
  if (name === 'cream' || name === 'ink') continue;
  writeFileSync(
    join(BRAND_DIR, 'lockups', `lockup-${name}.svg`),
    lockupSvg(hexColor, hexColor),
  );
}

for (const [name, hexColor] of Object.entries(COLORS)) {
  if (name === 'cream' || name === 'ink') continue;
  for (const size of [192, 512]) {
    const out = join(BRAND_DIR, 'png', `icon-${name}-${size}.png`);
    writeFileSync(out, pngIcon(size, hexColor));
    console.log('wrote', out);
  }
  const creamOut = join(BRAND_DIR, 'png', `icon-${name}-on-cream-512.png`);
  writeFileSync(creamOut, pngIcon(512, hexColor, COLORS.cream));
  console.log('wrote', creamOut);
}

console.log('Yarn brand assets written to brand/yarn/');
