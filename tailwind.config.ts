import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const fieldUtilities = plugin(({ addUtilities }) => {
  addUtilities({
    '.field-label': {
      'text-transform': 'uppercase',
      'letter-spacing': '0.04em',
      'font-weight': '600',
    },
    '.text-accessible-sm': {
      'font-size': '0.8125rem',
      'line-height': '1.375rem',
    },
    '.text-accessible-md': {
      'font-size': '0.9375rem',
      'line-height': '1.625rem',
    },
    '.text-accessible-lg': {
      'font-size': '1.0625rem',
      'line-height': '1.75rem',
    },
  });
});

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        'report-xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'report-sm': ['0.75rem', { lineHeight: '1rem' }],
        report: ['0.875rem', { lineHeight: '1.25rem' }],
        'report-md': ['1rem', { lineHeight: '1.5rem' }],
        'report-lg': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      letterSpacing: {
        'wide-md': '0.04em',
      },
      lineHeight: {
        'relaxed-plus': '1.75',
      },
    },
  },
  plugins: [fieldUtilities],
};

export default config;
