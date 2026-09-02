import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'oxalpha:theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const theme = writable<Theme>(getInitialTheme());

// Apply the resolved theme to <html> (Tailwind's darkMode: 'class') and
// persist explicit choices so a reload doesn't revert to system preference.
theme.subscribe((value) => {
  document.documentElement.classList.toggle('dark', value === 'dark');
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch (err) {
    console.error('Failed to persist theme preference:', err);
  }
});

export function toggleTheme() {
  theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
}
