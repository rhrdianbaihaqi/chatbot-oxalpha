import './app.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Target element #app not found in DOM');
}

// Use Svelte 4 compatible constructor pattern to avoid SSR detection issues in Svelte 5
const app = new (App as any)({ target });

export default app;
