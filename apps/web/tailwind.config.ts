import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Core palette — warm canvas + cobalt blue accent ───────────
        // Cobalt blue — the signature brand color used for active states,
        // hover transitions, accent text, gradient highlights. Class
        // names kept as `ember-*` so existing component references
        // continue to resolve without per-file rewrites; only the color
        // VALUES were swapped from orange to blue.
        ember: {
          DEFAULT: '#1E55E8',
          50: '#EEF3FE',
          100: '#D6E1FC',
          200: '#ADC3F8',
          300: '#84A6F5',
          400: '#5B8DEF',
          500: '#1E55E8',
          600: '#1745C0',
          700: '#11349A',
          glow: '#5B8DEF',
        },
        // Deep premium navy — sidebar, primary button rest state, hero card.
        navy: {
          DEFAULT: '#161A2C',
          soft: '#232843',
          900: '#0D101C',
          800: '#161A2C',
          700: '#232843',
          600: '#2E3556',
        },
        // Warm canvas + paper.
        cream: {
          DEFAULT: '#FBF6EE',
          deep: '#F5EDDF',
        },
        paper: '#FFFEFB',
        // Ink scale — text colors. Warmer than slate.
        ink: {
          DEFAULT: '#1A1D2E',
          soft: '#4B5066',
          mute: '#8B8FA3',
        },
        // Warm beige border lines.
        line: {
          DEFAULT: '#E8DFCF',
          soft: '#F0E8D8',
        },
        // ─── Accents — paired with their soft companion for chips ────
        emerald: { DEFAULT: '#0F8A65', soft: '#D6F0E3' },
        amber: { DEFAULT: '#D97706', soft: '#FCE8C5' },
        rose: { DEFAULT: '#C8345C', soft: '#FBE0E6' },
        sky: { DEFAULT: '#2563A8', soft: '#D8E7F6' },

        // Tailwind aliases preserved for code that already imports them.
        primary: {
          DEFAULT: '#1E55E8',
          50: '#EEF3FE',
          100: '#D6E1FC',
          200: '#ADC3F8',
          300: '#84A6F5',
          400: '#5B8DEF',
          500: '#1E55E8',
          600: '#1745C0',
          700: '#11349A',
          800: '#0C2873',
          900: '#081D54',
        },
        accent: {
          DEFAULT: '#5B8DEF',
          400: '#5B8DEF',
          500: '#1E55E8',
        },
        secondary: {
          DEFAULT: '#161A2C',
          500: '#161A2C',
          600: '#232843',
        },
        success: { DEFAULT: '#0F8A65', 500: '#0F8A65', 600: '#0C6E50' },
        warning: { DEFAULT: '#D97706', 500: '#D97706', 600: '#B45309' },
        danger: { DEFAULT: '#C8345C', 500: '#C8345C', 600: '#A02749' },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        container: '1600px',
      },
      borderRadius: {
        sm: '10px',
        DEFAULT: '14px',
        lg: '16px',
        xl: '22px',
        '2xl': '22px',
        '3xl': '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(22, 26, 44, 0.04), 0 1px 1px rgba(22, 26, 44, 0.03)',
        warm: '0 4px 16px -4px rgba(22, 26, 44, 0.08), 0 2px 4px rgba(22, 26, 44, 0.04)',
        elevated:
          '0 18px 40px -12px rgba(22, 26, 44, 0.14), 0 4px 12px rgba(22, 26, 44, 0.05)',
        // Cobalt blue glow — primary button hover lift + hero card glow.
        ember:
          '0 18px 40px -14px rgba(30, 85, 232, 0.45), 0 4px 12px rgba(30, 85, 232, 0.15)',
        glow:
          '0 18px 40px -14px rgba(30, 85, 232, 0.45), 0 4px 12px rgba(30, 85, 232, 0.15)',
      },
      backgroundImage: {
        // Cobalt → sky gradient (kept under the `grad-ember` name so
        // every existing class ref resolves without churn).
        'grad-ember': 'linear-gradient(135deg, #1E55E8 0%, #5B8DEF 100%)',
        'grad-ember-dark': 'linear-gradient(135deg, #1745C0 0%, #1E55E8 100%)',
        'grad-navy': 'linear-gradient(135deg, #161A2C 0%, #232843 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
