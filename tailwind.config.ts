import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm paper palette carried over from the original design language.
        cream: {
          DEFAULT: '#f7f1e6', // oklch(97% 0.014 75) approx
          outer: '#efe7d7', // page behind the phone frame
          card: '#fdfbf5', // card surface
        },
        ink: '#3a352c', // primary text — oklch(24% 0.02 50) approx
        muted: '#8a8172', // secondary text
        // Destination accents (hue varies per place).
        bangkok: '#c9992e', // saffron / gold
        phuket: '#2f97a6', // turquoise
        saigon: '#b0472f', // lacquer red
        nhatrang: '#3f9b8a', // jade / teal
      },
      fontFamily: {
        serif: ['var(--font-spectral)', 'Georgia', 'serif'],
        sans: ['var(--font-work-sans)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-caveat)', 'cursive'],
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(60,40,20,.05)',
        polaroid: '0 4px 14px rgba(60,40,20,.14)',
        sheet: '0 -8px 30px rgba(40,30,15,.16)',
      },
    },
  },
  plugins: [],
};

export default config;
