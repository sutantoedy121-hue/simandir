import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--neu-bg)',
        'surface-inset': 'var(--neu-inset-bg)',
        accent: {
          DEFAULT: 'var(--neu-accent)',
          hover: 'var(--neu-accent-hover)',
          soft: 'var(--neu-accent-soft)',
        },
        content: {
          DEFAULT: 'var(--neu-text)',
          muted: 'var(--neu-text-muted)',
        },
        danger: 'var(--neu-danger)',
        success: 'var(--neu-success)',
      },
      boxShadow: {
        'neu-raised': '6px 6px 12px var(--neu-shadow-dark), -6px -6px 12px var(--neu-shadow-light)',
        'neu-raised-sm': '3px 3px 6px var(--neu-shadow-dark), -3px -3px 6px var(--neu-shadow-light)',
        'neu-inset': 'inset 3px 3px 6px var(--neu-shadow-dark), inset -3px -3px 6px var(--neu-shadow-light)',
        'neu-inset-deep': 'inset 4px 4px 8px var(--neu-shadow-dark), inset -4px -4px 8px var(--neu-shadow-light)',
      },
      borderRadius: {
        neu: '16px',
        'neu-lg': '24px',
      },
    },
  },
  plugins: [],
}
export default config
