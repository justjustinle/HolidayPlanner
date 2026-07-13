# Yarn — Brand Assets

Standalone branding package for the **Yarn** rebrand. Live app surfaces (`/public/icons/`, manifest, itinerary header) use the gold mark; regenerate here when geometry or palette changes.

Regenerate everything:

```bash
npx tsx scripts/gen-yarn-brand.ts
```

Open `brand/yarn/preview.html` in a browser to review the full set.

## Typeface

| Property | Value |
|----------|-------|
| **Family** | [Varela Round](https://fonts.google.com/specimen/Varela+Round) |
| **Weight** | 400 (Regular) |
| **Usage** | Wordmark and future UI headings |
| **Rationale** | Rounded terminals echo the soft, organic yarn-ball mark |

```html
<link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet" />
```

```css
--font-yarn: 'Varela Round', system-ui, -apple-system, sans-serif;
```

TypeScript tokens: `lib/brand/yarn.ts`

## Colour palette

| Name | Hex | Role |
|------|-----|------|
| **Gold** | `#c59837` | Warm primary accent (proposed SVG) |
| **Terracotta** | `#C4613A` | Earthy secondary accent |
| **Teal** | `#2A6875` | Cool contrast accent |
| **Forest** | `#2F5A42` | Grounded neutral accent |
| Cream | `#F7F1E6` | Background (matches app cream) |
| Ink | `#3A352C` | Body text on cream |

Machine-readable: `brand/yarn/tokens.json`

## Files

```
brand/yarn/
├── icon.svg                          # Master mark (currentColor)
├── icons/
│   ├── icon-gold.svg
│   ├── icon-terracotta.svg
│   ├── icon-teal.svg
│   ├── icon-forest.svg
│   └── icon-dual-ink-terracotta.svg  # Reference-sheet dual-tone
├── wordmarks/
│   ├── wordmark-{color}.svg          # Transparent background
│   └── wordmark-{color}-on-cream.svg
├── lockups/
│   └── lockup-{color}.svg            # Icon + "Yarn" on cream card
├── png/
│   ├── icon-{color}-192.png          # Transparent PWA-ready
│   ├── icon-{color}-512.png
│   └── icon-{color}-on-cream-512.png
├── tokens.json
├── preview.html
└── README.md
```

## Mark construction

The yarn-ball icon is the **exact proposed SVG** (single filled `evenodd` path, artboard 384×352). Geometry lives in `lib/brand/yarn-icon.ts` (single source for SVG, React `YarnLogo`, and PNG export via resvg). Colour is injected at render time so the mark can theme with city accents.

## Next steps (when ready to rebrand)

1. Pick a primary colour (gold or forest are strong defaults).
2. Swap `/public/icons/` with chosen `png/icon-*-*.png` exports.
3. Update `manifest.json`, `app/layout.tsx` metadata, and `WelcomeGate` copy.
4. Add Varela Round to `app/layout.tsx` if adopting for UI headings.
