// Canonical yarn-ball icon paths — single source for SVG, React, and PNG export.
// Matches the proposed mark: outer ring + parallel wrapping strands + U-shaped loose end.
export const YARN_ICON = {
  viewBox: '0 0 100 100',
  cx: 54,
  cy: 40,
  r: 30,
  stroke: 6.5,
  strandStroke: 6.5,
  /** Parallel wraps that bow downward left→right (wound-yarn volume). */
  ballPaths: [
    { type: 'circle' as const },
    { type: 'path' as const, d: 'M 32 24 C 42 34, 66 34, 76 24' },
    { type: 'path' as const, d: 'M 26 36 C 40 48, 68 48, 82 36' },
    { type: 'path' as const, d: 'M 30 50 C 42 60, 66 60, 78 50' },
  ],
  /** Loose end — exits bottom-left, dips, then curves slightly up (U-wave). */
  strand: { type: 'path' as const, d: 'M 30 58 C 14 64, 10 82, 24 90' },
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
