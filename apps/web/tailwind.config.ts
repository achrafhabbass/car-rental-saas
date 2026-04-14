import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A6B',
          50: '#E8EEF7',
          100: '#C6D3E8',
          200: '#94AED2',
          300: '#6289BC',
          400: '#3F67A3',
          500: '#1B3A6B',
          600: '#162F56',
          700: '#112441',
          800: '#0B182C',
          900: '#060C16',
        },
        secondary: {
          DEFAULT: '#2563EB',
        },
        accent: {
          DEFAULT: '#F59E0B',
        },
        success: {
          DEFAULT: '#10B981',
        },
        danger: {
          DEFAULT: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
