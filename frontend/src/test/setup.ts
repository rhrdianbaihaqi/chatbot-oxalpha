import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

// @testing-library/svelte's built-in auto-cleanup only registers itself
// against a *global* afterEach, which this project doesn't enable (see
// vite.config.ts) — so unmount rendered components explicitly instead.
afterEach(() => {
  cleanup();
});
