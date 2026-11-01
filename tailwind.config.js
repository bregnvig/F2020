/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  // The dark class is set by ColorSchemeService, so dark: follows the choice of the player instead of the device
  darkMode: 'selector',
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
          'error',
        ].map(role => [role, `var(--mat-sys-${role})`]),
      ),
    },
  },
  plugins: [],
};
