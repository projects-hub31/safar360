/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Static ramps — safar360 design system
        ink: {
          0: '#FFFFFF', 50: '#FAFCFB', 100: '#F5F7F6', 200: '#E8ECEB', 300: '#D3DAD8',
          400: '#A2ADAA', 500: '#63716D', 600: '#5C6A67', 700: '#3B4644', 800: '#232B29',
          900: '#131A18', 950: '#0A0F0E',
        },
        jade: {
          50: '#F1F8F6', 100: '#E7F3F0', 200: '#9BD5C8', 300: '#5FBBA9', 400: '#2E9B87',
          500: '#178A76', 600: '#097969', 700: '#065F52', 800: '#054B40', 900: '#042E28',
        },
        amber: {
          50: '#FFF8E6', 100: '#FFF0C2', 200: '#FFE28A', 300: '#FFD24D', 400: '#FFCA28',
          500: '#FFC107', 600: '#E5AA00', 700: '#7A5A00', 800: '#5C4400', 900: '#3D2D00',
        },
        // Theme-aware semantic tokens — backed by CSS variables in index.css,
        // so light/dark swap automatically under [data-theme="dark"] with no dark: prefixes needed.
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        sunken: 'var(--sunken)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          loud: 'var(--border-loud)',
        },
        fg: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          press: 'var(--primary-press)',
          on: 'var(--primary-on)',
          soft: 'var(--primary-soft)',
          'soft-text': 'var(--primary-soft-text)',
          line: 'var(--primary-line)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          text: 'var(--accent-text)',
          line: 'var(--accent-line)',
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)', text: 'var(--success-text)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)', text: 'var(--warning-text)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)', text: 'var(--danger-text)', hover: 'var(--danger-hover)' },
        info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)', text: 'var(--info-text)' },
        held: { DEFAULT: 'var(--held)', soft: 'var(--held-soft)', text: 'var(--held-text)' },
      },
      fontFamily: {
        ui: ['"Plus Jakarta Sans"', 'Segoe UI', 'system-ui', '-apple-system', '"Helvetica Neue"', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', '"Avenir Next"', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'SF Mono', 'Cascadia Mono', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sh1: 'var(--sh1)',
        sh2: 'var(--sh2)',
        sh3: 'var(--sh3)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
