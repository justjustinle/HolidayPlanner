// Generates Yarn brand SVG + PNG assets. Does not touch existing /public/icons/.
// Run: node scripts/gen-yarn-brand.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIRS = [
  join(__dirname, '../brand/yarn'),
  join(__dirname, '../assets'),
];

const COLORS = {
  black: '#1A1A1A',
  gold: '#B8963E',
  terracotta: '#C4613A',
  teal: '#2A6875',
  forest: '#2F5A42',
  cream: '#F7F1E6',
  ink: '#3A352C',
};

// Original reference icon: thick stroke line art with outer ring + winding curves + strand.
const ICON = {
  cx: 52,
  cy: 44,
  r: 28,
  stroke: 6,
  strandStroke: 6.5,
  ballPaths: [
    { type: 'circle' },
    { type: 'path', d: 'M 26 44 C 32 28, 72 28, 78 44 C 72 60, 32 60, 26 44' },
    { type: 'path', d: 'M 52 16 C 68 28, 68 60, 52 72' },
    { type: 'path', d: 'M 34 54 C 52 44, 70 54' },
    { type: 'path', d: 'M 34 36 C 52 46, 70 36' },
  ],
  strand: { type: 'path', d: 'M 24 54 C 14 58, 8 70, 4 82' },
};

function ballPathMarkup() {
  return ICON.ballPaths
    .map((p) => {
      if (p.type === 'circle') {
        return `<circle cx="${ICON.cx}" cy="${ICON.cy}" r="${ICON.r}"/>`;
      }
      return `<path d="${p.d}"/>`;
    })
    .join('\n    ');
}

function strandPathMarkup() {
  return `<path d="${ICON.strand.d}"/>`;
}

function strokeAttrs(color, width) {
  return `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
}

/** Single-colour line-art mark matching the original reference sheet. */
function iconSvg(color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" role="img" aria-label="Yarn">
  <g ${strokeAttrs(color, ICON.stroke)}>
    ${ballPathMarkup()}
  </g>
  <g ${strokeAttrs(color, ICON.strandStroke)}>
    ${strandPathMarkup()}
  </g>
</svg>
`;
}

/** Dual-tone from the reference: black ball + terracotta strand. */
function iconDualSvg(ballColor, strandColor) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" role="img" aria-label="Yarn">
  <g ${strokeAttrs(ballColor, ICON.stroke)}>
    ${ballPathMarkup()}
  </g>
  <g ${strokeAttrs(strandColor, ICON.strandStroke)}>
    ${strandPathMarkup()}
  </g>
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
  </defs>
  <rect width="280" height="100" fill="${bg}" rx="16"/>
  <g transform="translate(-2 6)" ${strokeAttrs(iconColor, ICON.stroke)}>
    ${ballPathMarkup()}
  </g>
  <g transform="translate(-2 6)" ${strokeAttrs(iconColor, ICON.strandStroke)}>
    ${strandPathMarkup()}
  </g>
  <text class="yarn-wordmark" x="108" y="62" fill="${textColor}">Yarn</text>
</svg>
`;
}

// --- Minimal PNG rasteriser (stroke-based) ---

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

function bezierPoint(t, x0, y0, x1, y1, x2, y2, x3, y3) {
  const u = 1 - t;
  return {
    x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
    y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
  };
}

function parsePathDistance(px, py, d) {
  const tokens = d.match(/[MLC]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let best = Infinity;

  const consider = (x, y) => {
    best = Math.min(best, Math.hypot(px - x, py - y));
  };

  const cubic = (x0, y0, x1, y1, x2, y2, x3, y3) => {
    for (let t = 0; t <= 48; t++) {
      const p = bezierPoint(t / 48, x0, y0, x1, y1, x2, y2, x3, y3);
      best = Math.min(best, Math.hypot(px - p.x, py - p.y));
    }
    cx = x3;
    cy = y3;
  };

  while (i < tokens.length) {
    const t = tokens[i++];
    if (/^[MLC]$/.test(t)) {
      cmd = t;
      continue;
    }
    if (cmd === 'M') {
      cx = Number(t);
      cy = Number(tokens[i++]);
      consider(cx, cy);
      cmd = 'L';
    } else if (cmd === 'C') {
      const x1 = Number(t);
      const y1 = Number(tokens[i++]);
      const x2 = Number(tokens[i++]);
      const y2 = Number(tokens[i++]);
      const x3 = Number(tokens[i++]);
      const y3 = Number(tokens[i++]);
      cubic(cx, cy, x1, y1, x2, y2, x3, y3);
    }
  }
  return best;
}

function onIconStroke(sx, sy) {
  const half = ICON.stroke / 2;
  const strandHalf = ICON.strandStroke / 2;
  if (Math.abs(Math.hypot(sx - ICON.cx, sy - ICON.cy) - ICON.r) <= half) return true;
  for (const p of ICON.ballPaths) {
    if (p.type === 'path' && parsePathDistance(sx, sy, p.d) <= half) return true;
  }
  return parsePathDistance(sx, sy, ICON.strand.d) <= strandHalf;
}

function pngIcon(size, fg, bg = null) {
  const fgRgb = hex(fg);
  const bgRgb = bg ? hex(bg) : null;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = bgRgb ? 2 : 6;

  if (!bgRgb) {
    const rgba = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y++) {
      const rowStart = y * (size * 4 + 1);
      rgba[rowStart] = 0;
      for (let x = 0; x < size; x++) {
        const sx = (x / size) * 100;
        const sy = (y / size) * 100;
        const onIcon = onIconStroke(sx, sy);
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

  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const sx = (x / size) * 100;
      const sy = (y / size) * 100;
      const color = onIconStroke(sx, sy) ? fgRgb : bgRgb;
      const p = rowStart + 1 + x * 3;
      raw[p] = color[0];
      raw[p + 1] = color[1];
      raw[p + 2] = color[2];
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writeAll(relPath, content) {
  for (const root of OUTPUT_DIRS) {
    writeFileSync(join(root, relPath), content);
  }
}

// --- Write assets ---

for (const root of OUTPUT_DIRS) {
  for (const sub of ['icons', 'wordmarks', 'lockups', 'png']) {
    mkdirSync(join(root, sub), { recursive: true });
  }
}

writeAll('icon.svg', iconSvg('currentColor'));

const ICON_COLORS = {
  black: COLORS.black,
  gold: COLORS.gold,
  terracotta: COLORS.terracotta,
  teal: COLORS.teal,
  forest: COLORS.forest,
};

for (const [name, hexColor] of Object.entries(ICON_COLORS)) {
  writeAll(`icons/icon-${name}.svg`, iconSvg(hexColor));
}

writeAll(
  'icons/icon-dual-black-terracotta.svg',
  iconDualSvg(COLORS.black, COLORS.terracotta),
);
// Keep legacy filename for references
writeAll(
  'icons/icon-dual-ink-terracotta.svg',
  iconDualSvg(COLORS.black, COLORS.terracotta),
);

for (const [name, hexColor] of Object.entries(COLORS)) {
  if (name === 'cream') continue;
  writeAll(`wordmarks/wordmark-${name}.svg`, wordmarkSvg(hexColor));
  writeAll(
    `wordmarks/wordmark-${name}-on-cream.svg`,
    wordmarkSvg(hexColor, COLORS.cream),
  );
}

for (const [name, hexColor] of Object.entries(ICON_COLORS)) {
  writeAll(`lockups/lockup-${name}.svg`, lockupSvg(hexColor, hexColor));
}

for (const [name, hexColor] of Object.entries(ICON_COLORS)) {
  for (const size of [192, 512]) {
    const rel = `png/icon-${name}-${size}.png`;
    const png = pngIcon(size, hexColor);
    for (const root of OUTPUT_DIRS) {
      writeFileSync(join(root, rel), png);
      console.log('wrote', join(root, rel));
    }
  }
  const rel = `png/icon-${name}-on-cream-512.png`;
  const png = pngIcon(512, hexColor, COLORS.cream);
  for (const root of OUTPUT_DIRS) {
    writeFileSync(join(root, rel), png);
    console.log('wrote', join(root, rel));
  }
}

writeAll('tokens.json', JSON.stringify({
  name: 'Yarn',
  typeface: {
    family: 'Varela Round',
    fallback: 'system-ui, -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Varela+Round&display=swap',
    weights: [400],
    usage: 'Wordmark and future UI headings. Rounded terminals complement the organic yarn-ball mark.',
  },
  colors: {
    black: { hex: COLORS.black, label: 'Black', note: 'Original reference icon — solid black line art' },
    gold: { hex: COLORS.gold, label: 'Gold', note: 'Muted ochre — warm primary accent' },
    terracotta: { hex: COLORS.terracotta, label: 'Terracotta', note: 'Burnt orange — strand accent in dual-tone mark' },
    teal: { hex: COLORS.teal, label: 'Teal', note: 'Deep blue-green — calm contrast' },
    forest: { hex: COLORS.forest, label: 'Forest', note: 'Dark pine green — grounded neutral accent' },
    cream: { hex: COLORS.cream, label: 'Cream', note: 'Brand background (matches existing app cream)' },
    ink: { hex: COLORS.ink, label: 'Ink', note: 'Body text on cream surfaces' },
  },
}, null, 2) + '\n');

console.log('Yarn brand assets written to brand/yarn/ and assets/');
