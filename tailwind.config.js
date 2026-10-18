/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        app: 'var(--text)',
        muted: 'var(--text-muted)',
      },
      borderColor: {
        app: 'var(--border)',
      },
    },
  },
  plugins: [],
};
