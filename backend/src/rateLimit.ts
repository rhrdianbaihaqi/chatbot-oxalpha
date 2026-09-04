const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

/**
 * Simple in-memory sliding-window rate limiter, keyed by an arbitrary
 * identifier (e.g. client IP). Good enough for a single-instance MVP
 * deployment — swap for a shared store (Redis, etc.) if this ever runs
 * behind multiple instances.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

// Periodically drop stale entries so the map doesn't grow unbounded over
// a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, fresh);
    }
  }
}, WINDOW_MS * 5).unref();
