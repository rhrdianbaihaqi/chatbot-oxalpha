import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      // Ensure Vite only bundles browser-side Svelte, not SSR
      compilerOptions: {
        css: 'injected',
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    // Explicitly resolve svelte's browser-safe entry points
    conditions: ['svelte', 'browser', 'module', 'import', 'default'],
  },
  optimizeDeps: {
    include: ['marked', 'highlight.js'],
    exclude: ['svelte'],
  },
});
