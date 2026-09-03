import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

// @testing-library/svelte's built-in auto-cleanup only registers itself
// against a *global* afterEach, which this project doesn't enable (see
// vite.config.ts) — so unmount rendered components explicitly instead.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement Element.scrollTo/scrollIntoView — stub them so
// components that scroll (e.g. ChatWindow's auto-scroll) don't throw.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
