// Yarn brand tokens — assets live in /brand/yarn/. Not wired into the app yet.
export const YARN_BRAND = {
  name: 'Yarn',
  typeface: {
    family: 'Varela Round',
    fallback: 'system-ui, -apple-system, sans-serif',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Varela+Round&display=swap',
  },
  colors: {
    gold: '#B8963E',
    terracotta: '#C4613A',
    teal: '#2A6875',
    forest: '#2F5A42',
    cream: '#F7F1E6',
    ink: '#3A352C',
  },
} as const;

export type YarnBrandColor = keyof typeof YARN_BRAND.colors;
