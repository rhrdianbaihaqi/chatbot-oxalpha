import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Force client-side generation, prevents Svelte 5 SSR detection false-positive
    runes: true,
    css: 'injected',
  },
};
