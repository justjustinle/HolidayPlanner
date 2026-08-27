// Generates Yarn brand SVG + PNG assets.
// Run: npx tsx scripts/gen-yarn-brand.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import {
  YARN_ICON,
  yarnIconPathMarkup,
  yarnIconSvg,
  yarnPwaIconSvg,
} from '../lib/brand/yarn-icon';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIRS = [
  join(__dirname, '../brand/yarn'),
  join(__dirname, '../assets'),
];
const PUBLIC_ICONS = join(__dirname, '../public/icons');

const COLORS = {
  black: '#1A1A1A',
  // Proposed SVG gold; brand token matches.
  gold: YARN_ICON.sourceGold,
  terracotta: '#C4613A',
  teal: '#2A6875',
  forest: '#2F5A42',
  cream: '#F7F1E6',
  ink: '#3A352C',
};

/** Dual-tone is a single path — use ball colour for the whole mark. */
function iconDualSvg(ballColor: string, _strandColor: string) {
  return yarnIconSvg(ballColor);
}

function wordmarkSvg(color: string, bg = 'transparent') {
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

function lockupSvg(iconColor: string, textColor: string, bg = COLORS.cream) {
  // Fit artboard into ~88px tall slot beside the wordmark.
  const scale = 88 / YARN_ICON.height;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" fill="none" role="img" aria-label="Yarn lockup">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Varela+Round&amp;display=swap');
      .yarn-wordmark { font-family: 'Varela Round', system-ui, sans-serif; font-size: 44px; font-weight: 400; letter-spacing: -0.02em; }
    </style>
  </defs>
  <rect width="280" height="100" fill="${bg}" rx="16"/>
  <g transform="translate(6 6) scale(${scale.toFixed(4)})">
    ${yarnIconPathMarkup(iconColor)}
  </g>
  <text class="yarn-wordmark" x="112" y="62" fill="${textColor}">Yarn</text>
</svg>
`;
}

function pngFromSvg(svg: string, size: number, bg?: string) {
  const inner = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] ?? svg;
  const wrapped = bg
    ? `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${YARN_ICON.viewBox}" width="${size}" height="${size}">
  <rect width="${YARN_ICON.width}" height="${YARN_ICON.height}" fill="${bg}"/>
  ${inner}
</svg>`
    : svg;
  const resvg = new Resvg(wrapped, {
    fitTo: { mode: 'width', value: size },
  });
  return resvg.render().asPng();
}

function writeAll(relPath: string, content: string | Buffer) {
  for (const root of OUTPUT_DIRS) {
    writeFileSync(join(root, relPath), content);
  }
}

for (const root of OUTPUT_DIRS) {
  for (const sub of ['icons', 'wordmarks', 'lockups', 'png']) {
    mkdirSync(join(root, sub), { recursive: true });
  }
}
mkdirSync(PUBLIC_ICONS, { recursive: true });

writeAll('icon.svg', yarnIconSvg('currentColor'));

const ICON_COLORS = {
  black: COLORS.black,
  gold: COLORS.gold,
  terracotta: COLORS.terracotta,
  teal: COLORS.teal,
  forest: COLORS.forest,
};

for (const [name, hexColor] of Object.entries(ICON_COLORS)) {
  writeAll(`icons/icon-${name}.svg`, yarnIconSvg(hexColor));
}

writeAll(
  'icons/icon-dual-black-terracotta.svg',
  iconDualSvg(COLORS.black, COLORS.terracotta),
);
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
  const svg = yarnIconSvg(hexColor);
  for (const size of [192, 512]) {
    const rel = `png/icon-${name}-${size}.png`;
    const png = pngFromSvg(svg, size);
    for (const root of OUTPUT_DIRS) {
      writeFileSync(join(root, rel), png);
      console.log('wrote', join(root, rel));
    }
  }
  const rel = `png/icon-${name}-on-cream-512.png`;
  const png = pngFromSvg(svg, 512, COLORS.cream);
  for (const root of OUTPUT_DIRS) {
    writeFileSync(join(root, rel), png);
    console.log('wrote', join(root, rel));
  }
}

writeAll(
  'tokens.json',
  `${JSON.stringify(
    {
      name: 'Yarn',
      typeface: {
        family: 'Varela Round',
        fallback: 'system-ui, -apple-system, sans-serif',
        googleFontsUrl:
          'https://fonts.googleapis.com/css2?family=Varela+Round&display=swap',
        weights: [400],
        usage:
          'Wordmark and future UI headings. Rounded terminals complement the organic yarn-ball mark.',
      },
      colors: {
        black: {
          hex: COLORS.black,
          label: 'Black',
          note: 'Solid black mark',
        },
        gold: {
          hex: COLORS.gold,
          label: 'Gold',
          note: 'Proposed SVG gold — live app icon',
        },
        terracotta: {
          hex: COLORS.terracotta,
          label: 'Terracotta',
          note: 'Warm secondary accent',
        },
        teal: { hex: COLORS.teal, label: 'Teal', note: 'Cool contrast accent' },
        forest: {
          hex: COLORS.forest,
          label: 'Forest',
          note: 'Grounded neutral accent',
        },
        cream: {
          hex: COLORS.cream,
          label: 'Cream',
          note: 'Brand background',
        },
        ink: { hex: COLORS.ink, label: 'Ink', note: 'Body text on cream' },
      },
    },
    null,
    2,
  )}\n`,
);

console.log('Yarn brand assets written to brand/yarn/ and assets/');

// Live app icons — gold mark on opaque white. Transparent PNGs read as a
// black home-screen tile on iOS (apple-touch) and Android (maskable).
const PWA_BG = '#FFFFFF';
const pwaSvg = yarnPwaIconSvg(COLORS.gold, PWA_BG, 512);
writeFileSync(join(PUBLIC_ICONS, 'icon.svg'), pwaSvg);
writeFileSync(join(PUBLIC_ICONS, 'icon-192.png'), pngFromSvg(pwaSvg, 192));
writeFileSync(join(PUBLIC_ICONS, 'icon-512.png'), pngFromSvg(pwaSvg, 512));
console.log('wrote public/icons/icon.svg, icon-192.png, icon-512.png');
