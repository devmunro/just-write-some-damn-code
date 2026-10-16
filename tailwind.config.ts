import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        ink: '#f3f0e8',
        paper: '#0e1117',
        surface: '#171c24',
        raised: '#202734',
        line: '#303948',
        steel: '#9aa6b5',
        action: '#24a891',
        warn: '#ff9b73'
      }
    }
  },
  plugins: []
} satisfies Config;
