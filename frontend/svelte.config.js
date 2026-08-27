import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Keep legacy Svelte 4 syntax support (export let, $:, on:event, afterUpdate, etc)
    // runes: false is the default in Svelte 5 without rune syntax in .svelte files
    runes: false,
  },
};
