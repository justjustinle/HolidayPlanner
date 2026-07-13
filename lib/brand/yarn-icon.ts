// Canonical yarn-ball icon paths — single source for SVG, React, and PNG export.
export const YARN_ICON = {
  viewBox: '0 0 100 100',
  cx: 52,
  cy: 44,
  r: 28,
  stroke: 6,
  strandStroke: 6.5,
  /** Outer ring + winding interior curves (proposed reference SVG). */
  ballPaths: [
    { type: 'circle' as const },
    {
      type: 'path' as const,
      d: 'M 26 44 C 32 28, 72 28, 78 44 C 72 60, 32 60, 26 44',
    },
    { type: 'path' as const, d: 'M 52 16 C 68 28, 68 60, 52 72' },
    { type: 'path' as const, d: 'M 34 54 C 52 44, 70 54' },
    { type: 'path' as const, d: 'M 34 36 C 52 46, 70 36' },
  ],
  /** Loose end — exits bottom-left with a gentle curl. */
  strand: { type: 'path' as const, d: 'M 24 54 C 14 58, 8 70, 4 82' },
};

export function yarnIconBallMarkup(): string {
  return YARN_ICON.ballPaths
    .map((p) =>
      p.type === 'circle'
        ? `<circle cx="${YARN_ICON.cx}" cy="${YARN_ICON.cy}" r="${YARN_ICON.r}"/>`
        : `<path d="${p.d}"/>`
    )
    .join('\n    ');
}

export function yarnIconStrandMarkup(): string {
  return `<path d="${YARN_ICON.strand.d}"/>`;
}

export function yarnIconSvg(color: string, strandColor = color): string {
  const { stroke, strandStroke } = YARN_ICON;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${YARN_ICON.viewBox}" fill="none" role="img" aria-label="Yarn">
  <g stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${yarnIconBallMarkup()}
  </g>
  <g stroke="${strandColor}" stroke-width="${strandStroke}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${yarnIconStrandMarkup()}
  </g>
</svg>
`;
}
