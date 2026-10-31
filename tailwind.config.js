/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./apps/ui/src/**/*.{html,ts}', './libs/**/*.{html,ts}'],
  theme: {
    extend: {
      // The colour roles of the Material theme, so the classes follow light and dark
      colors: Object.fromEntries(
        [
          'primary',
          'on-primary',
          'surface',
          'on-surface',
          'on-surface-variant',
          'surface-container-low',
          'surface-container',
          'surface-container-highest',
          'outline',
          'outline-variant',
        ].map(role => [role, `var(--mat-sys-${role})`]),
      ),
    },
  },
  plugins: [],
};
