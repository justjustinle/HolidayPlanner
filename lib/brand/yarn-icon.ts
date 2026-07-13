// Canonical yarn-ball icon paths — single source for SVG, React, and PNG export.
export const YARN_ICON = {
  viewBox: '0 0 100 100',
  cx: 50,
  cy: 46,
  r: 29,
  stroke: 5.5,
  strandStroke: 5.5,
  /** Three intersecting interior curves + outer ring (reference sheet). */
  ballPaths: [
    { type: 'circle' as const },
    { type: 'path' as const, d: 'M 50 17 C 68 32, 68 60, 50 75' },
    { type: 'path' as const, d: 'M 50 17 C 32 32, 32 60, 50 75' },
    { type: 'path' as const, d: 'M 22 46 C 38 58, 62 58, 78 46' },
  ],
  /** Loose end — exits bottom-left with a gentle S-wave. */
  strand: { type: 'path' as const, d: 'M 27 60 C 15 66, 9 78, 15 88' },
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
